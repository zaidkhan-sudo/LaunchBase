import redisClient from '../config/redis.js'
import Deployment, { MAX_LOG_LINES } from '../models/deployment.model.js'
import Project from '../models/project.js'

// Single global channel. One channel per project would mean managing
// subscribe/unsubscribe lifecycles on the API side for no gain — io.to() on an
// empty room is already a no-op.
const EVENTS_CHANNEL = 'deployment:events'

// Flush thresholds. Docker output is chatty: writing every line to Mongo
// individually would be hundreds of round-trips per build. Realtime delivery
// (publish, immediate) and durability (Mongo, batched) have different latency
// budgets, so they are handled separately.
const FLUSH_INTERVAL_MS = 1000
const FLUSH_LINE_COUNT = 50

// Strips ANSI escape sequences. `docker build` output is full of these; cleaning
// here keeps both the DB and the frontend clean, so the UI needs no ANSI library.
// Built from strings with explicit unicode escapes so this source file holds no
// literal control bytes.
const ANSI_PATTERN = new RegExp(
    [
        // OSC (window title etc): ESC ] ... terminated by BEL or ST.
        // The payload may contain spaces, so match anything up to the terminator.
        '\\u001B\\][^\\u0007\\u001B]*(?:\\u0007|\\u001B\\\\)',
        // CSI / SGR: colors, cursor movement, line erase.
        '[\\u001B\\u009B][[\\]()#;?]*(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]',
        // Catch-all for any escape byte the branches above did not consume, so a
        // malformed sequence can never leak a control character into the log.
        '[\\u001B\\u009B\\u0007]',
    ].join('|'),
    'g'
)

function stripAnsi(text) {
    return text.replace(ANSI_PATTERN, '')
}

/**
 * Turn a raw child-process chunk (or a plain string) into clean log lines.
 * Handles \r\n, bare \r (progress bars overwrite in place), and drops blanks.
 */
function toLines(chunk) {
    return stripAnsi(chunk.toString())
        .split(/\r?\n|\r/)
        .map((line) => line.trimEnd())
        .filter((line) => line.length > 0)
}

async function publish(payload) {
    try {
        await redisClient.publish(EVENTS_CHANNEL, JSON.stringify(payload))
    } catch (error) {
        // A logging failure must never abort a build.
        console.error('[LogService] Failed to publish event:', error.message)
    }
}

/**
 * Creates a logger bound to one deployment.
 *
 * Every method mirrors to two places: Redis (realtime, for connected browsers)
 * and Mongo (durable, so a refresh or a late visit can replay the build).
 *
 * @param {{projectId: string, deploymentId: string}} ids
 * @returns {{log: Function, step: Function, status: Function, flush: Function}}
 */
function createLogger({ projectId, deploymentId }) {
    const pid = String(projectId)
    const did = String(deploymentId)

    let buffer = []
    let flushTimer = null
    let flushing = Promise.resolve()

    async function writeBatch(batch) {
        try {
            await Deployment.findByIdAndUpdate(did, {
                $push: {
                    logs: { $each: batch, $slice: -MAX_LOG_LINES },
                },
            })
        } catch (error) {
            console.error('[LogService] Failed to persist log batch:', error.message)
        }
    }

    function scheduleFlush() {
        if (flushTimer) return
        flushTimer = setTimeout(() => {
            flushTimer = null
            flush()
        }, FLUSH_INTERVAL_MS)
    }

    /**
     * Drain the buffer to Mongo. Chained so concurrent callers cannot interleave
     * writes out of order, and awaitable so the worker's `finally` can guarantee
     * the tail of the log is never lost.
     */
    function flush() {
        if (flushTimer) {
            clearTimeout(flushTimer)
            flushTimer = null
        }
        if (buffer.length === 0) return flushing

        const batch = buffer
        buffer = []
        flushing = flushing.then(() => writeBatch(batch))
        return flushing
    }

    /**
     * Emit log output. Accepts a raw Buffer/chunk or a string; a single chunk may
     * contain many lines, and each becomes its own event.
     */
    function log(chunk, stream = 'stdout') {
        const lines = toLines(chunk)
        if (lines.length === 0) return

        for (const line of lines) {
            const ts = new Date()
            const entry = { ts, line, stream }

            buffer.push(entry)
            // Mirror to stdout so `npm run worker` stays readable while developing.
            console.log(`[${stream}] ${line}`)

            publish({
                type: 'log',
                projectId: pid,
                deploymentId: did,
                ts: ts.toISOString(),
                line,
                stream,
            })
        }

        if (buffer.length >= FLUSH_LINE_COUNT) flush()
        else scheduleFlush()
    }

    /**
     * Mark a build step's state. Stamps startedAt on 'running' and finishedAt on
     * any terminal state so the UI can show per-step durations.
     */
    async function step(name, stepStatus) {
        const now = new Date()
        const set = { 'steps.$[s].status': stepStatus }

        if (stepStatus === 'running') set['steps.$[s].startedAt'] = now
        if (stepStatus === 'success' || stepStatus === 'failed' || stepStatus === 'skipped') {
            set['steps.$[s].finishedAt'] = now
        }

        try {
            await Deployment.findByIdAndUpdate(
                did,
                { $set: set },
                { arrayFilters: [{ 's.name': name }] }
            )
        } catch (error) {
            console.error(`[LogService] Failed to update step ${name}:`, error.message)
        }

        await publish({
            type: 'step',
            projectId: pid,
            deploymentId: did,
            ts: now.toISOString(),
            step: name,
            status: stepStatus,
        })
    }

    /**
     * Set the deployment status, and mirror it onto the Project so the dashboard
     * badge stays correct without reading the deployment collection.
     *
     * @param {string} newStatus one of QUEUED|BUILDING|DEPLOYING|READY|FAILED
     * @param {object} extra optional fields (liveUrl, errorMessage, ecrImageUri, taskArn)
     */
    async function status(newStatus, extra = {}) {
        const now = new Date()
        const isTerminal = newStatus === 'READY' || newStatus === 'FAILED'

        const update = { status: newStatus, ...extra }
        if (newStatus === 'BUILDING') update.startedAt = now
        if (isTerminal) update.finishedAt = now

        try {
            await Deployment.findByIdAndUpdate(did, update)
        } catch (error) {
            console.error('[LogService] Failed to update deployment status:', error.message)
        }

        try {
            const projectUpdate = { status: newStatus }
            if (extra.liveUrl) projectUpdate.liveUrl = extra.liveUrl
            if (extra.ecrImageUri) projectUpdate.ecrImageUri = extra.ecrImageUri
            await Project.findByIdAndUpdate(pid, projectUpdate)
        } catch (error) {
            console.error('[LogService] Failed to mirror status to project:', error.message)
        }

        // Persist any buffered lines before announcing a terminal state, so a
        // client that refetches on READY/FAILED sees the complete log.
        if (isTerminal) await flush()

        await publish({
            type: 'status',
            projectId: pid,
            deploymentId: did,
            ts: now.toISOString(),
            status: newStatus,
            liveUrl: extra.liveUrl ?? null,
            errorMessage: extra.errorMessage ?? null,
        })
    }

    return { log, step, status, flush }
}

export { createLogger, EVENTS_CHANNEL, stripAnsi, toLines }
