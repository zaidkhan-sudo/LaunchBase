import { Link } from 'react-router-dom'
import { ArrowRight, Boxes, GitBranch, ScrollText, Triangle, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import FeatureHighlights from '@/components/FeatureHighlights'
import HeroDiagram from '@/components/HeroDiagram'
import WorkflowSection from '@/components/WorkflowSection'
import Footer from '@/components/Footer'

const PIPELINE = [
  { icon: GitBranch, title: 'Push to Git', body: 'A webhook fires the moment you push. HMAC-verified, then queued.' },
  { icon: Boxes, title: 'Containerize', body: 'Node, Python and Go are detected and a Dockerfile is generated if you have none.' },
  { icon: ScrollText, title: 'Watch it build', body: 'Docker output streams to your browser over WebSockets, line by line.' },
  { icon: Zap, title: 'Run serverless', body: 'The image lands in ECR and runs as an AWS Fargate task. No servers to manage.' },
]

export default function Landing() {
  const accessToken = useAuthStore((state) => state.accessToken)

  return (
    <div className="flex-1 flex flex-col w-full h-full min-h-screen">
      <header className="border-b border-border relative z-50 bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Triangle className="size-4 fill-fg" />
            <span className="text-sm font-semibold tracking-tight">LaunchBase</span>
          </div>
          <div className="flex items-center gap-2">
            {accessToken ? (
              <Link to="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ---- Main Content with Background ---- */}
      <main className="flex-1 flex flex-col">
        {/* ---- Brutalist Hero ---- */}
        <div className="relative flex-1 flex flex-col justify-center min-h-[calc(100vh-3.5rem)] px-6 md:px-12 py-20 border-b border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none"></div>

          <div className="relative z-10 max-w-7xl mx-auto w-full">
            {/* Status Indicator */}
            <div className="flex items-center gap-2 mb-8 md:mb-12">
              <div className="h-2 w-2 rounded-full bg-[#00e599] animate-pulse"></div>
              <span className="text-[#00e599] font-mono text-xs md:text-sm font-bold tracking-widest uppercase">
                SYSTEMS OPERATIONAL
              </span>
            </div>

            <div className="flex flex-col lg:flex-row justify-between gap-12 items-start">
              <div className="flex-shrink-0">

                {/* Huge Headline */}
                <h1 className="text-[11vw] sm:text-[7rem] md:text-[9rem] lg:text-[11rem] font-black leading-[0.85] tracking-tighter text-white uppercase mb-12 lg:mb-16">
                  DEPLOY<br />
                  FAST.<br />
                  SCALE<br />
                  HARD.
                </h1>

                {/* Info Box */}
                <div className="max-w-xl border border-white/10 bg-[#0a0a0a]/90 backdrop-blur-md p-6 sm:p-10">
                  <div className="font-mono text-[10px] text-white/50 mb-6">/ LAUNCH_01</div>
                  <p className="text-white/70 text-sm md:text-base leading-relaxed mb-8 font-medium">
                    LaunchBase clones your repository, builds a Docker image, pushes it to ECR, and runs it on Fargate—while you watch the build log stream live. No consoles, no configuration overhead.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link to={accessToken ? '/dashboard' : '/register'} className="flex-1">
                      <button className="w-full bg-white text-black font-bold uppercase tracking-widest text-xs py-4 px-6 hover:bg-gray-200 transition-colors border border-white">
                        {accessToken ? 'DASHBOARD' : 'INITIALIZE'}
                      </button>
                    </Link>
                    <a href="#pipeline" className="flex-1">
                      <button className="w-full bg-transparent border border-white/20 text-white font-bold uppercase tracking-widest text-xs py-4 px-6 hover:bg-white/5 transition-colors">
                        VIEW LOGIC
                      </button>
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="hidden lg:block absolute right-0 top-[55%] -translate-y-1/2 w-[45vw] max-w-2xl z-10">
            <div className="translate-x-4 sm:translate-x-8">
              <HeroDiagram />
            </div>
          </div>
        </div>

        <WorkflowSection />

        <FeatureHighlights />

        <Footer />
      </main>
    </div>
  )
}
