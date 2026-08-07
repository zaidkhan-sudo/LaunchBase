import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Container,
  Database,
  GitBranch,
  Github,
  Globe2,
  KeyRound,
  Rocket,
  ServerCog,
  ShieldCheck,
  Terminal,
  Webhook,
} from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: Github,
    title: "Connect a repo",
    body: "Paste a GitHub URL and let LaunchBase create the deployment project around it.",
  },
  {
    icon: Webhook,
    title: "Push to deploy",
    body: "GitHub webhooks enqueue builds automatically, so the API stays fast and responsive.",
  },
  {
    icon: Container,
    title: "Ship a container",
    body: "Workers clone, build, tag, and push Docker images before handing them to cloud compute.",
  },
];

const capabilities = [
  {
    icon: ServerCog,
    title: "Async build pipeline",
    body: "Redis-backed workers handle build and deploy jobs away from the request cycle.",
  },
  {
    icon: ShieldCheck,
    title: "Verified webhooks",
    body: "HMAC signatures protect deployment triggers before a build ever enters the queue.",
  },
  {
    icon: KeyRound,
    title: "Rotating sessions",
    body: "Access and refresh tokens support safer auth across multiple devices.",
  },
  {
    icon: Activity,
    title: "Live status updates",
    body: "Project states move from pending to building, ready, or failed in the dashboard.",
  },
];

const logs = [
  "[04:29:02] webhook verified for main",
  "[04:29:04] cloning github.com/acme/api",
  "[04:29:18] docker build completed",
  "[04:29:31] image pushed to ECR",
  "[04:29:44] service is live",
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteNav />
      <section className="relative border-b">
        <div className="absolute inset-0 -z-10 bg-grid opacity-45" aria-hidden="true" />
        <div
          className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(circle_at_20%_18%,hsl(var(--primary)/0.16),transparent_34%),linear-gradient(180deg,hsl(var(--background)),transparent)]"
          aria-hidden="true"
        />
        <div className="container grid min-h-[calc(100vh-73px)] items-center gap-12 py-16 lg:grid-cols-[1fr_0.92fr] lg:py-20">
          <div className="min-w-0 max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-sm text-muted-foreground backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
              Git push to live container infrastructure
            </div>
            <h1 className="text-balance text-4xl font-medium leading-[1.04] tracking-normal sm:text-6xl lg:text-7xl">
              Deploy from GitHub without babysitting servers.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-xl">
              LaunchBase turns a repository into a running app with webhook-triggered builds,
              Docker images, cloud deployment, and a clean dashboard for status.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/login">
                  Start deploying
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#workflow">See workflow</a>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                JWT auth
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                Docker builds
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                AWS-ready pipeline
              </span>
            </div>
          </div>
          <HeroConsole />
        </div>
      </section>

      <section id="workflow" className="container py-20 sm:py-24">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-primary">
            Build flow
          </p>
          <h2 className="text-balance text-3xl font-medium tracking-normal sm:text-5xl">
            The path from repository to live URL stays short.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title} className="bg-card/70">
              <CardContent className="p-6">
                <div className="mb-8 flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border bg-secondary">
                    <step.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-sm text-muted-foreground">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="text-xl font-medium">{step.title}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{step.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y bg-secondary/25">
        <div className="container grid gap-10 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:py-24">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-primary">
              Platform shape
            </p>
            <h2 className="text-balance text-3xl font-medium tracking-normal sm:text-5xl">
              Built for the deployment loop your backend already supports.
            </h2>
            <p className="mt-5 leading-8 text-muted-foreground">
              The UI is intentionally quiet: one clear action, readable status, and terminal-like
              details only where developers expect them.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {capabilities.map((item) => (
              <Card key={item.title} className="bg-background/70">
                <CardContent className="p-6">
                  <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h3 className="mt-5 text-lg font-medium">{item.title}</h3>
                  <p className="mt-2 leading-7 text-muted-foreground">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-20 sm:py-24">
        <div className="rounded-xl border bg-card p-6 sm:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-balance text-3xl font-medium tracking-normal sm:text-5xl">
                Ready when your backend is.
              </h2>
              <p className="mt-4 max-w-2xl leading-8 text-muted-foreground">
                Start with authentication and project creation, then layer in dashboard polling,
                deploy history, logs, and environment variables as the next screens come online.
              </p>
            </div>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/login">
                Open login
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/88 backdrop-blur-xl">
      <div className="container flex h-[72px] items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a className="transition-colors hover:text-foreground" href="#workflow">
            Workflow
          </a>
          <a className="transition-colors hover:text-foreground" href="#security">
            Security
          </a>
          <a className="transition-colors hover:text-foreground" href="#docs">
            Docs
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/login">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function HeroConsole() {
  return (
    <div className="relative mx-auto w-full min-w-0 max-w-[560px] lg:mx-0">
      <div
        className="absolute -inset-8 -z-10 rounded-[2rem] bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <Card className="min-w-0 overflow-hidden bg-card/86 shadow-glow backdrop-blur">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          </div>
          <span className="font-mono text-xs text-muted-foreground">launchbase deploy</span>
        </div>
        <CardContent className="p-0">
          <div className="grid min-w-0 grid-cols-1 border-b md:grid-cols-[1fr_0.8fr]">
            <div className="min-w-0 border-b p-5 md:border-b-0 md:border-r">
              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <GitBranch className="h-4 w-4" aria-hidden="true" />
                acme/checkout-api
              </div>
              <div className="space-y-3 font-mono text-sm">
                <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border bg-secondary/60 px-3 py-2">
                  <span className="truncate">$ git push origin main</span>
                  <Clock3 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <div className="rounded-lg border bg-background p-3">
                  {logs.map((log) => (
                    <p key={log} className="truncate py-1 text-muted-foreground">
                      <span className="text-primary">&gt;</span> {log}
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <div className="min-w-0 p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium">Production</span>
                <span className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Live
                </span>
              </div>
              <div className="space-y-3">
                <MiniMetric label="Build" value="1m 42s" />
                <MiniMetric label="Image" value="sha256:9ca8" />
                <MiniMetric label="Region" value="us-east-1" />
              </div>
            </div>
          </div>
          <div className="grid gap-0 sm:grid-cols-3">
            <PipelineItem icon={Terminal} label="Webhook" />
            <PipelineItem icon={Database} label="Queue" />
            <PipelineItem icon={Globe2} label="Live URL" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-lg border bg-secondary/40 p-3">
      <p className="font-mono text-[11px] uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-sm">{value}</p>
    </div>
  );
}

function PipelineItem({ icon: Icon, label }) {
  return (
    <div className="flex items-center justify-center gap-2 border-r px-4 py-4 last:border-r-0">
      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
      <span className="font-mono text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer id="docs" className="border-t">
      <div className="container flex flex-col gap-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Rocket className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>LaunchBase frontend foundation</span>
        </div>
        <div id="security" className="flex flex-wrap gap-5">
          <span>HMAC webhooks</span>
          <span>JWT sessions</span>
          <span>Container deploys</span>
        </div>
      </div>
    </footer>
  );
}
