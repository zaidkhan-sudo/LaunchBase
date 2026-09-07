import React, { useEffect, useRef } from 'react';
import { GitBranch, Boxes, ScrollText, Zap } from 'lucide-react';

export default function WorkflowSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const steps = Array.from(section.querySelectorAll('.logic-step'));
    const line = section.querySelector('#logic-process-line');
    let visibleCount = 0;

    const updateLine = () => {
      const progress = visibleCount / steps.length;
      if (line) {
        line.style.strokeDashoffset = `${1 - progress}`;
      }
    };

    updateLine();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const index = steps.indexOf(entry.target);
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('is-visible');
            visibleCount = Math.max(
              visibleCount,
              steps.filter((step) => step.classList.contains('is-visible')).length
            );
            updateLine();
          }, index * 120);
        }
      });
    }, {
      threshold: 0.45,
      rootMargin: "0px 0px -8% 0px"
    });

    steps.forEach((step) => observer.observe(step));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="mx-auto w-[80%] max-w-[1400px] py-24 sm:py-32">
      <div
        ref={sectionRef}
        className="mx-auto w-full rounded-[36px] border border-white/10 bg-[#050505] relative overflow-hidden shadow-2xl pt-32 pb-32 px-8 lg:px-12"
      >
        <style>{`
          .logic-grid {
            background-image:
              linear-gradient(rgba(0, 229, 153, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 229, 153, 0.15) 1px, transparent 1px);
            background-size: 140px 140px;
            mask-image: radial-gradient(circle at center, black 35%, transparent 95%);
            -webkit-mask-image: radial-gradient(circle at center, black 35%, transparent 95%);
          }

          .logic-line-bg {
            stroke: rgba(255, 255, 255, 0.08);
            stroke-width: 2;
            stroke-dasharray: 4 6;
          }

          .logic-line-progress {
            stroke: #00e599;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-dasharray: 1;
            stroke-dashoffset: 1;
            filter: drop-shadow(0 0 8px rgba(0, 229, 153, 0.6));
            transition: stroke-dashoffset 0.8s ease;
          }

          .logic-step {
            opacity: 0.35;
            transform: translateY(30px);
            transition:
              opacity 0.7s ease,
              transform 0.7s ease;
          }

          .logic-step.is-visible {
            opacity: 1;
            transform: translateY(0);
          }

          .logic-node {
            transition:
              border-color 0.5s ease,
              box-shadow 0.5s ease,
              background 0.5s ease,
              transform 0.5s ease;
          }

          .logic-step.is-visible .logic-node {
            border-color: rgba(0, 229, 153, 0.42);
            box-shadow:
              0 0 0 1px rgba(0, 229, 153, 0.08),
              0 0 24px rgba(0, 229, 153, 0.08),
              inset 0 0 30px rgba(0, 229, 153, 0.04);
            background:
              radial-gradient(circle at center, rgba(0, 229, 153, 0.08), rgba(5, 5, 5, 1) 70%);
            transform: scale(1.03);
          }

          .logic-step.is-visible .logic-card {
            border-color: rgba(0, 229, 153, 0.14);
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.02),
              0 0 0 1px rgba(0, 229, 153, 0.02),
              0 18px 60px rgba(0, 0, 0, 0.24);
          }

          .logic-step.is-visible .logic-accent {
            opacity: 1;
            transform: scaleX(1);
          }

          .logic-card {
            position: relative;
            overflow: hidden;
            transition:
              border-color 0.5s ease,
              box-shadow 0.5s ease,
              opacity 0.5s ease,
              transform 0.5s ease;
          }

          .logic-card::after {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(120deg,
                transparent 0%,
                rgba(0, 229, 153, 0.05) 50%,
                transparent 100%);
            transform: translateX(-130%);
            transition: transform 0.9s ease;
            pointer-events: none;
          }

          .logic-step.is-visible .logic-card::after {
            transform: translateX(130%);
          }

          .logic-accent {
            opacity: 0;
            transform: scaleX(0.3);
            transform-origin: left;
            transition:
              opacity 0.6s ease,
              transform 0.6s ease;
          }

          .logic-bars span {
            transform-origin: left center;
            animation: logicBarPulse 2.6s ease-in-out infinite;
          }

          .logic-bars span:nth-child(2) {
            animation-delay: 0.15s;
          }

          .logic-bars span:nth-child(3) {
            animation-delay: 0.3s;
          }

          .logic-squares div {
            animation: logicSquarePulse 2.8s ease-in-out infinite;
          }

          .logic-squares div:nth-child(2) {
            animation-delay: 0.2s;
          }

          .logic-squares div:nth-child(3) {
            animation-delay: 0.4s;
          }

          .logic-wave span {
            animation: logicWave 1.8s ease-in-out infinite;
            transform-origin: bottom;
          }

          .logic-wave span:nth-child(2) {
            animation-delay: 0.12s;
          }

          .logic-wave span:nth-child(3) {
            animation-delay: 0.24s;
          }

          .logic-wave span:nth-child(4) {
            animation-delay: 0.36s;
          }

          .logic-wave span:nth-child(5) {
            animation-delay: 0.48s;
          }

          @keyframes logicBarPulse {
            0%,
            100% {
              opacity: 0.28;
              transform: scaleX(0.55);
            }
            50% {
              opacity: 1;
              transform: scaleX(1);
            }
          }

          @keyframes logicSquarePulse {
            0%,
            100% {
              opacity: 0.35;
              transform: translateY(0) scale(1);
              border-color: rgba(255, 255, 255, 0.14);
            }
            50% {
              opacity: 1;
              transform: translateY(-2px) scale(1.03);
              border-color: rgba(0, 229, 153, 0.35);
            }
          }

          @keyframes logicWave {
            0%,
            100% {
              transform: scaleY(0.45);
              opacity: 0.35;
            }
            50% {
              transform: scaleY(1);
              opacity: 1;
            }
          }
        `}</style>

        <div className="logic-grid absolute inset-0 pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,153,0.06),transparent_55%)] pointer-events-none"></div>

        <div className="max-w-3xl mx-auto text-center mb-24 relative z-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-4">
            Four steps, fully automated
          </h2>
          <p className="text-white/50 text-sm md:text-base lg:text-lg font-light">
            A Redis-backed worker queue keeps the API responsive while builds run in the background.
          </p>
        </div>

        <div className="z-10 max-w-6xl mx-auto relative">
          {/* center animated line */}
          <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-20 -translate-x-1/2 pointer-events-none flex justify-center">
            <svg height="100%" width="2" className="absolute inset-y-0 left-1/2 -translate-x-1/2 overflow-visible">
              <line x1="1" y1="0" x2="1" y2="100%" className="logic-line-bg"></line>
              <line x1="1" y1="0" x2="1" y2="100%" className="logic-line-progress" id="logic-process-line" pathLength="1" style={{ strokeDashoffset: 1 }}></line>
            </svg>
          </div>

          <div className="-space-y-12 md:-space-y-24 relative" id="logic-steps">

            {/* Step 1: Push to Git */}
            <div className="logic-step flex flex-col md:flex-row items-start md:items-center justify-between gap-8 md:gap-0 relative min-h-[200px]">
              <div className="hidden md:block md:w-5/12"></div>

              <div className="absolute left-0 md:left-1/2 top-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10">
                <div className="logic-node w-20 h-20 bg-[#050505] border border-white/10 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,1)]">
                  <span className="text-xs font-mono text-white/70">01</span>
                </div>
              </div>

              <div className="md:w-5/12 pl-20 md:pl-12 w-full transition-all duration-500">
                <div className="group relative overflow-hidden p-5 lg:p-6 hover:bg-white/10 transition-all duration-500 bg-white/5 border border-white/10 rounded-2xl w-full">

                  {/* Enhanced code window */}
                  <div className="relative overflow-hidden bg-neutral-950/90 w-full border border-white/20 rounded-xl shadow-[0_40px_120px_rgba(0,0,0,0.7)] backdrop-blur-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/15 bg-white/5">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-red-500/90 shadow-sm"></span>
                        <span className="h-3 w-3 rounded-full bg-yellow-500/90 shadow-sm"></span>
                        <span className="h-3 w-3 rounded-full bg-green-500/90 shadow-sm"></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/50 font-mono">webhook.json</span>
                        <div className="h-2 w-2 rounded-full bg-emerald-400/60"></div>
                      </div>
                    </div>

                    {/* Code Content */}
                    <pre className="text-[11px] lg:text-xs leading-relaxed text-white/80 font-mono p-4 overflow-x-auto">
                      <span className="text-purple-400">&#123;</span>{`\n`}
                      {`  `}<span className="text-emerald-400">"ref"</span>: <span className="text-amber-300">"refs/heads/main"</span>,{`\n`}
                      {`  `}<span className="text-emerald-400">"commits"</span>: <span className="text-blue-400">[</span>{`\n`}
                      {`    `}<span className="text-purple-400">&#123;</span>{`\n`}
                      {`      `}<span className="text-emerald-400">"id"</span>: <span className="text-amber-300">"a1b2c3d4"</span>,{`\n`}
                      {`      `}<span className="text-emerald-400">"message"</span>: <span className="text-amber-300">"feat: init deployment"</span>{`\n`}
                      {`    `}<span className="text-purple-400">&#125;</span>{`\n`}
                      {`  `}<span className="text-blue-400">]</span>{`\n`}
                      <span className="text-purple-400">&#125;</span>
                    </pre>

                    {/* Status bar */}
                    <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 bg-white/5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                        <span className="text-[10px] lg:text-xs text-emerald-400 font-mono">Queued</span>
                      </div>
                      <span className="text-[10px] lg:text-xs text-white/40 font-mono">JSON</span>
                    </div>
                  </div>

                  <div className="mt-6 text-left">
                    <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-[#00e599]/10 border border-[#00e599]/20">
                      <GitBranch className="text-[#00e599] h-3.5 w-3.5" />
                      <span className="text-[11px] lg:text-xs font-medium text-[#00e599] font-mono tracking-wide">Git</span>
                    </div>
                    <h3 className="text-xl lg:text-2xl font-semibold tracking-tight text-white mb-2 group-hover:text-[#00e599] transition-colors">
                      Push to Git
                    </h3>
                    <p className="text-sm lg:text-base text-white/50 font-light leading-relaxed">
                      A webhook fires the moment you push. HMAC-verified, then queued.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Containerize */}
            <div className="logic-step flex flex-col md:flex-row-reverse items-start md:items-center justify-between gap-8 md:gap-0 relative min-h-[200px]">
              <div className="hidden md:block md:w-5/12"></div>

              <div className="absolute left-0 md:left-1/2 top-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10">
                <div className="logic-node w-20 h-20 bg-[#050505] border border-white/10 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,1)]">
                  <span className="text-xs font-mono text-white/70">02</span>
                </div>
              </div>

              <div className="md:w-5/12 pr-0 md:pr-12 pl-20 md:pl-0 w-full transition-all duration-500">
                <div className="group relative overflow-hidden p-5 lg:p-6 hover:bg-white/10 transition-all duration-500 bg-white/5 border border-white/10 rounded-2xl w-full">

                  {/* Enhanced code window */}
                  <div className="relative overflow-hidden bg-neutral-950/90 w-full border border-white/20 rounded-xl shadow-[0_40px_120px_rgba(0,0,0,0.7)] backdrop-blur-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/15 bg-white/5">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-red-500/90 shadow-sm"></span>
                        <span className="h-3 w-3 rounded-full bg-yellow-500/90 shadow-sm"></span>
                        <span className="h-3 w-3 rounded-full bg-green-500/90 shadow-sm"></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/50 font-mono">Dockerfile</span>
                        <div className="h-2 w-2 rounded-full bg-amber-400/60"></div>
                      </div>
                    </div>

                    {/* Code Content */}
                    <pre className="text-[11px] lg:text-xs leading-relaxed text-white/80 font-mono p-4 overflow-x-auto">
                      <span className="text-purple-400">FROM</span> <span className="text-amber-300">node:20-alpine</span>{`\n`}
                      <span className="text-purple-400">WORKDIR</span> <span className="text-emerald-400">/app</span>{`\n`}
                      <span className="text-purple-400">COPY</span> <span className="text-white">package*.json ./</span>{`\n`}
                      <span className="text-purple-400">RUN</span> <span className="text-amber-300">npm</span> <span className="text-white">install</span>{`\n`}
                      <span className="text-purple-400">COPY</span> <span className="text-white">. .</span>{`\n`}
                      <span className="text-purple-400">CMD</span> <span className="text-blue-400">[</span><span className="text-emerald-400">"npm"</span>, <span className="text-emerald-400">"start"</span><span className="text-blue-400">]</span>
                    </pre>

                    {/* Status bar */}
                    <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 bg-white/5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-400"></div>
                        <span className="text-[10px] lg:text-xs text-amber-400 font-mono">Building</span>
                      </div>
                      <span className="text-[10px] lg:text-xs text-white/40 font-mono">Docker</span>
                    </div>
                  </div>

                  <div className="mt-6 text-left">
                    <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20">
                      <Boxes className="text-amber-400 h-3.5 w-3.5" />
                      <span className="text-[11px] lg:text-xs font-medium text-amber-400 font-mono tracking-wide">Docker</span>
                    </div>
                    <h3 className="text-xl lg:text-2xl font-semibold tracking-tight text-white mb-2 group-hover:text-amber-300 transition-colors">
                      Containerize
                    </h3>
                    <p className="text-sm lg:text-base text-white/50 font-light leading-relaxed">
                      Node, Python and Go are detected and a Dockerfile is generated if you have none.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Watch it build */}
            <div className="logic-step flex flex-col md:flex-row items-start md:items-center justify-between gap-8 md:gap-0 relative min-h-[200px]">
              <div className="hidden md:block md:w-5/12"></div>

              <div className="absolute left-0 md:left-1/2 top-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10">
                <div className="logic-node w-20 h-20 bg-[#050505] border border-white/10 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,1)]">
                  <span className="text-xs font-mono text-white/70">03</span>
                </div>
              </div>

              <div className="md:w-5/12 pl-20 md:pl-12 w-full transition-all duration-500">
                <div className="group relative overflow-hidden p-5 lg:p-6 hover:bg-white/10 transition-all duration-500 bg-white/5 border border-white/10 rounded-2xl w-full">

                  {/* Enhanced code window */}
                  <div className="relative overflow-hidden bg-neutral-950/90 w-full border border-white/20 rounded-xl shadow-[0_40px_120px_rgba(0,0,0,0.7)] backdrop-blur-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/15 bg-white/5">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-red-500/90 shadow-sm"></span>
                        <span className="h-3 w-3 rounded-full bg-yellow-500/90 shadow-sm"></span>
                        <span className="h-3 w-3 rounded-full bg-green-500/90 shadow-sm"></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/50 font-mono">build.log</span>
                        <div className="h-2 w-2 rounded-full bg-blue-400/60 animate-pulse"></div>
                      </div>
                    </div>

                    {/* Code Content */}
                    <pre className="text-[11px] lg:text-xs leading-relaxed text-white/80 font-mono p-4 overflow-x-auto">
                      <span className="text-white/50">[1/5]</span> <span className="text-purple-400">FROM</span> <span className="text-amber-300">node:20-alpine</span>{`\n`}
                      <span className="text-white/40"> ---&gt; 4a4e5282245b</span>{`\n`}
                      <span className="text-white/50">[2/5]</span> <span className="text-purple-400">WORKDIR</span> <span className="text-emerald-400">/app</span>{`\n`}
                      <span className="text-white/50">[3/5]</span> <span className="text-purple-400">RUN</span> <span className="text-amber-300">npm</span> <span className="text-white">install</span>{`\n`}
                      <span className="text-white/40"> ---&gt; added 150 packages</span>{`\n`}
                      <span className="text-[#00e599]">✅ Build complete</span>
                    </pre>

                    {/* Status bar */}
                    <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 bg-white/5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></div>
                        <span className="text-[10px] lg:text-xs text-blue-400 font-mono">Streaming</span>
                      </div>
                      <span className="text-[10px] lg:text-xs text-white/40 font-mono">UTF-8</span>
                    </div>
                  </div>

                  <div className="mt-6 text-left">
                    <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-blue-400/10 border border-blue-400/20">
                      <ScrollText className="text-blue-400 h-3.5 w-3.5" />
                      <span className="text-[11px] lg:text-xs font-medium text-blue-400 font-mono tracking-wide">Terminal</span>
                    </div>
                    <h3 className="text-xl lg:text-2xl font-semibold tracking-tight text-white mb-2 group-hover:text-blue-300 transition-colors">
                      Watch it build
                    </h3>
                    <p className="text-sm lg:text-base text-white/50 font-light leading-relaxed">
                      Docker output streams to your browser over WebSockets, line by line.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Run serverless */}
            <div className="logic-step flex flex-col md:flex-row-reverse items-start md:items-center justify-between gap-8 md:gap-0 relative min-h-[200px]">
              <div className="hidden md:block md:w-5/12"></div>

              <div className="absolute left-0 md:left-1/2 top-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10">
                <div className="logic-node w-20 h-20 bg-[#050505] border border-white/10 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,1)]">
                  <span className="text-xs font-mono text-white/70">04</span>
                </div>
              </div>

              <div className="md:w-5/12 pr-0 md:pr-12 pl-20 md:pl-0 w-full transition-all duration-500">
                <div className="group relative overflow-hidden p-5 lg:p-6 hover:bg-white/10 transition-all duration-500 bg-white/5 border border-white/10 rounded-2xl w-full">

                  {/* Enhanced code window */}
                  <div className="relative overflow-hidden bg-neutral-950/90 w-full border border-white/20 rounded-xl shadow-[0_40px_120px_rgba(0,0,0,0.7)] backdrop-blur-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/15 bg-white/5">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-red-500/90 shadow-sm"></span>
                        <span className="h-3 w-3 rounded-full bg-yellow-500/90 shadow-sm"></span>
                        <span className="h-3 w-3 rounded-full bg-green-500/90 shadow-sm"></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/50 font-mono">deployment.json</span>
                        <div className="h-2 w-2 rounded-full bg-fuchsia-400/60"></div>
                      </div>
                    </div>

                    {/* Code Content */}
                    <pre className="text-[11px] lg:text-xs leading-relaxed text-white/80 font-mono p-4 overflow-x-auto">
                      <span className="text-purple-400">&#123;</span>{`\n`}
                      {`  `}<span className="text-emerald-400">"cluster"</span>: <span className="text-amber-300">"launchbase-cluster"</span>,{`\n`}
                      {`  `}<span className="text-emerald-400">"service"</span>: <span className="text-amber-300">"app-svc-xyz"</span>,{`\n`}
                      {`  `}<span className="text-emerald-400">"status"</span>: <span className="text-amber-300">"RUNNING"</span>,{`\n`}
                      {`  `}<span className="text-emerald-400">"endpoint"</span>: <span className="text-blue-400">"https://app.launchbase.dev"</span>{`\n`}
                      <span className="text-purple-400">&#125;</span>
                    </pre>

                    {/* Status bar */}
                    <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 bg-white/5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-fuchsia-400"></div>
                        <span className="text-[10px] lg:text-xs text-fuchsia-400 font-mono">Running</span>
                      </div>
                      <span className="text-[10px] lg:text-xs text-white/40 font-mono">JSON</span>
                    </div>
                  </div>

                  <div className="mt-6 text-left">
                    <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-fuchsia-400/10 border border-fuchsia-400/20">
                      <Zap className="text-fuchsia-400 h-3.5 w-3.5" />
                      <span className="text-[11px] lg:text-xs font-medium text-fuchsia-400 font-mono tracking-wide">AWS Fargate</span>
                    </div>
                    <h3 className="text-xl lg:text-2xl font-semibold tracking-tight text-white mb-2 group-hover:text-fuchsia-300 transition-colors">
                      Run serverless
                    </h3>
                    <p className="text-sm lg:text-base text-white/50 font-light leading-relaxed">
                      The image lands in ECR and runs as an AWS Fargate task. No servers to manage.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
