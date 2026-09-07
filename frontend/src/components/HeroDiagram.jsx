import React from 'react';
import { Terminal, Box, Activity, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

export default function HeroDiagram() {
  return (
    <div 
      className="rounded-[36px] p-4 sm:p-6 relative w-full max-w-2xl mx-auto lg:ml-auto shadow-2xl overflow-hidden ring-1 ring-white/30" 
      style={{ 
        backgroundColor: '#0a0a0a',
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
        backgroundSize: '4px 4px',
        WebkitMaskImage: 'linear-gradient(230deg, transparent, black 10%, black 70%, transparent)', 
        maskImage: 'linear-gradient(230deg, transparent, black 10%, black 70%, transparent)' 
      }}
    >
      
      <article className="group relative overflow-hidden transition-shadow hover:shadow-md bg-[#0a0a0a] border border-white/20 rounded-3xl shadow-xl z-10">
        <div className="p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-2xl font-semibold tracking-tight text-white">Smart Pipeline</h3>
            <span className="inline-flex items-center gap-2 text-[10px] sm:text-xs text-white/80 bg-white/5 border border-white/10 rounded-full px-2.5 py-1 backdrop-blur-sm">
              <Zap className="h-3.5 w-3.5 text-[#00e599]" />
              Auto-Detected
            </span>
          </div>

          {/* Illustration */}
          <div className="relative h-56 sm:h-64 rounded-2xl bg-gradient-to-b from-white/5 to-white/10 ring-1 ring-inset ring-white/5 mb-8 backdrop-blur-sm overflow-hidden">
            {/* Search bar equivalent -> Terminal */}
            <div className="absolute left-4 sm:left-6 top-4 sm:top-6 w-[85%] rounded-2xl bg-black/90 backdrop-blur border border-white/10 shadow-sm">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                <Terminal className="h-4 w-4 text-[#00e599]" />
                <div className="h-2 w-32 bg-[#00e599]/40 rounded"></div>
                <div className="ml-auto flex gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-red-500/80"></div>
                  <div className="h-2 w-2 rounded-full bg-yellow-500/80"></div>
                  <div className="h-2 w-2 rounded-full bg-green-500/80"></div>
                </div>
              </div>
              <div className="p-3 space-y-2">
                <div className="text-[9px] sm:text-[10px] text-white/40 tracking-widest px-2 font-mono">BUILD_LOGS</div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5">
                  <CheckCircle2 className="h-3 w-3 text-white/60" />
                  <div className="h-1.5 w-24 bg-white/20 rounded"></div>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5">
                  <Activity className="h-3 w-3 text-white/60" />
                  <div className="h-1.5 w-20 bg-white/20 rounded"></div>
                </div>
              </div>
            </div>

            {/* Results panel equivalent -> AWS panel */}
            <div className="absolute left-4 sm:left-6 bottom-4 sm:bottom-6 w-[85%] rounded-2xl bg-black/90 backdrop-blur border border-white/10 shadow-sm">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                <span className="text-[10px] sm:text-xs tracking-widest text-white/60 font-mono">AWS_FARGATE</span>
                <span className="text-[9px] sm:text-[10px] text-[#00e599] font-mono animate-pulse">LIVE</span>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-start gap-2 bg-[#00e599]/10 border border-[#00e599]/20 rounded-lg px-2 py-2">
                  <Box className="h-3.5 w-3.5 text-[#00e599] flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1 mt-1">
                    <div className="h-1 w-full bg-[#00e599]/40 rounded"></div>
                    <div className="h-1 w-3/4 bg-[#00e599]/30 rounded"></div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-white/60 px-2 font-mono">
                  <Activity className="h-2.5 w-2.5 text-white/40" />
                  <span>Routing traffic...</span>
                </div>
              </div>
            </div>

            {/* Floating suggestions equivalent -> Resources */}
            <div className="absolute right-4 sm:right-6 top-24 sm:top-28 w-[42%] rounded-xl bg-black/90 backdrop-blur border border-white/10 shadow-sm p-2">
              <div className="text-[9px] sm:text-[10px] text-white/40 tracking-widest mb-1.5 font-mono">RESOURCES</div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded px-1.5 py-1">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  <div className="h-1 w-16 bg-blue-400/40 rounded"></div>
                </div>
                <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded px-1.5 py-1">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                  <div className="h-1 w-12 bg-purple-400/40 rounded"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 mb-8 gap-x-6 gap-y-6">
            <div>
              <h4 className="text-lg font-semibold text-white tracking-tight">Zero Config</h4>
              <p className="mt-2 text-sm text-white/60">Push your code and we automatically detect Node.js, Python, or Go.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold tracking-tight text-white">Live Logs</h4>
              <p className="mt-2 text-sm text-white/60">Watch your Docker builds and deployments stream in real-time.</p>
            </div>
          </div>

          {/* CTA */}
          <div>
            <a href="#pipeline" className="inline-flex items-center gap-2 text-xs font-medium text-white/90 hover:text-white">
              Explore pipeline
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}
