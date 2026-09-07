import {
    CreateTargetGroupCommand,
    DeleteTargetGroupCommand,
    DescribeTargetGroupsCommand,
    ModifyTargetGroupAttributesCommand,
    CreateRuleCommand,
    ModifyRuleCommand,
    DeleteRuleCommand,
    DescribeRulesCommand,
    DescribeTargetHealthCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2"
import { createHash } from "crypto"
import { elbClient } from "../config/aws.js"
import config from "../config/config.js"

/*
  Port the user's container listens on. Must stay in sync with the portMappings
  in ecs.service.js — the ALB forwards here, so a mismatch means every health
  check fails and the ALB serves 503 forever. Exported so ecs.service.js can
  import it instead of hardcoding 8080 a second time.
*/
export const CONTAINER_PORT = 8080

/* Rule priorities 1-9 stay free for platform-level rules (apex domain, health
   endpoints) that may be added later. Per-project rules start at 10. */
const FIRST_PROJECT_PRIORITY = 10

/* AWS hard limit. Hitting it means new deploys fail, which is why deleting a
   project must also delete its rule. */
const MAX_RULES_PER_LISTENER = 100

function assertAlbEnabled() {
    if (!config.ALB_ENABLED) {
        throw new Error(
            "ALB routing is not configured — set AWS_VPC_ID, AWS_ALB_LISTENER_ARN and PLATFORM_DOMAIN"
        )
    }
}

/**
 * Target group names are capped at 32 chars, alphanumeric + hyphens, and cannot
 * start or end with a hyphen. Project names have no length limit, so the name is
 * truncated and suffixed with a hash of the project id: the hash keeps two
 * projects that truncate to the same prefix from colliding, and being derived
 * from the id (not a counter) makes it stable across redeploys.
 *
 * Layout: "lb-" + up to 20 chars + "-" + 8 hex = 32 max.
 */
function targetGroupName(projectId, projectName) {
    const hash = createHash("sha1").update(String(projectId)).digest("hex").slice(0, 8)

    const base = String(projectName || "")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .slice(0, 20)
        .replace(/^-+|-+$/g, "")

    return `lb-${base || "app"}-${hash}`
}

/** The subdomain this project answers on, e.g. "blog.example.xyz". */
function hostForProject(projectName) {
    assertAlbEnabled()
    return `${projectName}.${config.PLATFORM_DOMAIN}`
}

/**
 * Public URL for a project. http, not https — serving TLS needs an ACM
 * certificate on a :443 listener, which is a separate piece of setup.
 */
function buildLiveUrl(projectName) {
    return `https://${hostForProject(projectName)}`
}

/**
 * Create the project's target group, or return the existing one.
 *
 * Idempotent by design: a redeploy calls this again, and without the
 * already-exists branch AWS would throw DuplicateTargetGroupName and kill the
 * build on its last step.
 */
async function ensureTargetGroup(projectId, projectName) {
    assertAlbEnabled()
    const name = targetGroupName(projectId, projectName)

    try {
        const existing = await elbClient.send(
            new DescribeTargetGroupsCommand({ Names: [name] })
        )
        const arn = existing.TargetGroups?.[0]?.TargetGroupArn
        if (arn) {
            console.log(`[ALB Service] Target group '${name}' already exists.`)
            return arn
        }
    } catch (error) {
        // Not found is the expected path on a first deploy; anything else is real.
        if (error.name !== "TargetGroupNotFoundException") throw error
    }

    console.log(`[ALB Service] Creating target group '${name}'...`)
    const created = await elbClient.send(
        new CreateTargetGroupCommand({
            Name: name,
            Protocol: "HTTP",
            Port: CONTAINER_PORT,
            VpcId: config.AWS_VPC_ID,
            // Fargate tasks have their own ENI, so targets are IPs, not instances.
            TargetType: "ip",

            HealthCheckEnabled: true,
            HealthCheckProtocol: "HTTP",
            HealthCheckPath: "/",
            // Tighter than the AWS defaults (30s / 5 checks) so a demo goes live
            // in ~30s instead of ~2.5 minutes.
            HealthCheckIntervalSeconds: 15,
            HealthCheckTimeoutSeconds: 5,
            HealthyThresholdCount: 2,
            UnhealthyThresholdCount: 2,
            // Deliberately permissive: plenty of apps answer / with a 302 to
            // /login, and a strict 200 would mark those unhealthy forever.
            Matcher: { HttpCode: "200-399" },
        })
    )

    const arn = created.TargetGroups[0].TargetGroupArn

    /*
      Attributes cannot be set on create. The default deregistration delay is
      300s, which would make deleting a project appear to hang for five minutes
      while the old target drains.
    */
    await elbClient.send(
        new ModifyTargetGroupAttributesCommand({
            TargetGroupArn: arn,
            Attributes: [{ Key: "deregistration_delay.timeout_seconds", Value: "5" }],
        })
    )

    console.log(`[ALB Service] Created target group: ${arn}`)
    return arn
}

/** Every rule on the listener, following pagination. */
async function listRules() {
    assertAlbEnabled()
    const rules = []
    let marker

    do {
        const page = await elbClient.send(
            new DescribeRulesCommand({
                ListenerArn: config.AWS_ALB_LISTENER_ARN,
                Marker: marker,
                PageSize: 100,
            })
        )
        rules.push(...(page.Rules || []))
        marker = page.NextMarker
    } while (marker)

    return rules
}

/** Reads the host values off a rule, tolerating both response shapes. */
function hostValuesOf(rule) {
    return (rule.Conditions || [])
        .filter((condition) => condition.Field === "host-header")
        .flatMap((condition) => condition.HostHeaderConfig?.Values || condition.Values || [])
}

/**
 * Lowest unused priority. Reusing gaps left by deleted projects matters: always
 * appending would march toward the 100-rule ceiling even while projects come
 * and go.
 */
function findFreePriority(rules) {
    const used = new Set(
        rules
            .map((rule) => Number(rule.Priority))
            .filter((priority) => Number.isFinite(priority))
    )

    for (let priority = FIRST_PROJECT_PRIORITY; priority < MAX_RULES_PER_LISTENER + FIRST_PROJECT_PRIORITY; priority++) {
        if (!used.has(priority)) return priority
    }

    throw new Error(
        `Listener has no free rule priority (limit ${MAX_RULES_PER_LISTENER}). Delete unused projects.`
    )
}

/**
 * Point `host` at `targetGroupArn`, creating the rule or repointing an existing
 * one. Repointing is the case that matters after a target group is recreated:
 * the old rule survives holding a dead ARN, and traffic would 503.
 */
async function ensureListenerRule(targetGroupArn, host) {
    assertAlbEnabled()
    const rules = await listRules()
    const existing = rules.find((rule) => hostValuesOf(rule).includes(host))

    if (existing) {
        const current = (existing.Actions || []).find((action) => action.Type === "forward")
        const alreadyCorrect = current?.TargetGroupArn === targetGroupArn

        if (alreadyCorrect) {
            console.log(`[ALB Service] Rule for '${host}' already points at the right target group.`)
            return existing.RuleArn
        }

        console.log(`[ALB Service] Repointing existing rule for '${host}'...`)
        await elbClient.send(
            new ModifyRuleCommand({
                RuleArn: existing.RuleArn,
                Actions: [{ Type: "forward", TargetGroupArn: targetGroupArn }],
            })
        )
        return existing.RuleArn
    }

    const priority = findFreePriority(rules)
    console.log(`[ALB Service] Creating rule for '${host}' at priority ${priority}...`)

    const created = await elbClient.send(
        new CreateRuleCommand({
            ListenerArn: config.AWS_ALB_LISTENER_ARN,
            Priority: priority,
            Conditions: [{ Field: "host-header", HostHeaderConfig: { Values: [host] } }],
            Actions: [{ Type: "forward", TargetGroupArn: targetGroupArn }],
        })
    )

    const arn = created.Rules[0].RuleArn
    console.log(`[ALB Service] Created rule: ${arn}`)
    return arn
}

/**
 * Health of the registered targets. The worker polls this to tell "the app is
 * live" apart from "the container started but the ALB will never route to it",
 * which otherwise looks identical from ECS's point of view.
 *
 * @returns {{total:number, healthy:number, states:string[], reasons:string[]}}
 */
async function getTargetHealth(targetGroupArn) {
    const response = await elbClient.send(
        new DescribeTargetHealthCommand({ TargetGroupArn: targetGroupArn })
    )

    const descriptions = response.TargetHealthDescriptions || []

    return {
        total: descriptions.length,
        healthy: descriptions.filter((d) => d.TargetHealth?.State === "healthy").length,
        states: descriptions.map((d) => d.TargetHealth?.State).filter(Boolean),
        reasons: descriptions
            .map((d) => d.TargetHealth?.Description)
            .filter(Boolean),
    }
}

/*
  Teardown. Both deletes swallow "already gone" so project deletion stays
  idempotent — a half-finished earlier attempt must not permanently block it.

  Order matters and is the caller's responsibility:
    delete service (force) -> wait for drain -> delete rule -> delete target group
  Deleting the target group first throws ResourceInUse.
*/
async function deleteListenerRuleByArn(ruleArn) {
    if (!ruleArn) return

    try {
        await elbClient.send(new DeleteRuleCommand({ RuleArn: ruleArn }))
        console.log(`[ALB Service] Deleted rule: ${ruleArn}`)
    } catch (error) {
        if (error.name === "RuleNotFoundException") {
            console.log(`[ALB Service] Rule already gone: ${ruleArn}`)
            return
        }
        throw error
    }
}

async function deleteTargetGroupByArn(targetGroupArn) {
    if (!targetGroupArn) return

    try {
        await elbClient.send(new DeleteTargetGroupCommand({ TargetGroupArn: targetGroupArn }))
        console.log(`[ALB Service] Deleted target group: ${targetGroupArn}`)
    } catch (error) {
        if (error.name === "TargetGroupNotFoundException") {
            console.log(`[ALB Service] Target group already gone: ${targetGroupArn}`)
            return
        }
        throw error
    }
}

export {
    targetGroupName,
    hostForProject,
    buildLiveUrl,
    ensureTargetGroup,
    ensureListenerRule,
    getTargetHealth,
    deleteListenerRuleByArn,
    deleteTargetGroupByArn,
    findFreePriority,
    listRules,
}
