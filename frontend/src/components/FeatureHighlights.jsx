import React, { useEffect, useRef, useState } from 'react';
import {
  Bolt, BarChart3, Radar, Activity, Globe2, Repeat, Star, ShieldCheck, BadgeCheck, Languages, Boxes, Inbox, MessageSquare, Calendar, Database, Workflow, UserPlus, Clock, BellRing, BarChart, Sparkles, Terminal, Rocket, Github, Layers, Zap, CheckCircle2, Shield, GitCommit, Box
} from 'lucide-react';

export default function FeatureHighlights() {


  const listRef = useRef(null);
  useEffect(() => {
    let y = 0;
    const speed = 0.25;
    let animationId;
    const step = () => {
      y += speed;
      if (listRef.current) {
        const setH = listRef.current.scrollHeight / 2;
        if (y >= setH) y = 0;
        listRef.current.style.transform = `translateY(-${y}px)`;
      }
      animationId = requestAnimationFrame(step);
    };
    animationId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const card3Ref = useRef(null);
  const shimmerRef = useRef(null);
  useEffect(() => {
    let x = -96;
    let animationId;
    const move = () => {
      x += 1.2;
      if (shimmerRef.current && shimmerRef.current.parentElement) {
        if (x > shimmerRef.current.parentElement.clientWidth + 96) x = -96;
        shimmerRef.current.style.transform = `translateX(${x}px)`;
      }
      animationId = requestAnimationFrame(move);
    };
    animationId = requestAnimationFrame(move);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const handleCard3MouseMove = (e) => {
    if (!card3Ref.current) return;
    const r = card3Ref.current.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
    const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
    card3Ref.current.style.transform = `perspective(1000px) rotateX(${dy * -2}deg) rotateY(${dx * 2}deg)`;
  };
  const handleCard3MouseLeave = () => {
    if (card3Ref.current) {
      card3Ref.current.style.transform = '';
    }
  };

  const [members, setMembers] = useState([
    { name: 'api-gateway', role: 'Node.js', img: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=80&auto=format&fit=crop', icon: Clock, action: 'Auto-deployed' },
    { name: 'auth-worker', role: 'Go', img: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=80&auto=format&fit=crop', icon: BellRing, action: 'Live' },
    { name: 'billing-service', role: 'Python', img: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=80&auto=format&fit=crop', icon: BarChart, action: 'Scaling' }
  ]);

  const addMember = () => {
    setMembers((prev) => [
      { name: 'new-service', role: 'Rust', img: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=80&auto=format&fit=crop', icon: Sparkles, action: 'Building...', isNew: true },
      ...prev
    ]);
  };

  const clients = [
    { name: 'Node.js API', loc: 'us-east-1 • Active', img: 'https://images.unsplash.com/photo-1621619856624-42fd193a0661?w=1080&q=80', icon: Star, color: 'text-amber-300' },
    { name: 'Python Worker', loc: 'eu-west-1 • Active', img: 'https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=80&auto=format&fit=crop', icon: ShieldCheck, color: 'text-emerald-300' },
    { name: 'Go Service', loc: 'ap-south-1 • Active', img: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=80&auto=format&fit=crop', icon: BadgeCheck, color: 'text-sky-300' }
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 pt-12 md:pt-20">
      <div className="bg-black rounded-3xl border border-white/10 p-6 sm:p-8 md:p-12 lg:p-16 shadow-2xl relative overflow-hidden">
      {/* Badge */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur">
          <Bolt className="h-4 w-4 text-sky-300" />
          <span className="text-sm text-sky-200/90">Feature Highlights</span>
        </div>
      </div>

      {/* Heading */}
      <h1 className="mt-6 text-center text-4xl md:text-6xl font-semibold tracking-tight text-white drop-shadow-sm">
        Feature Highlights to Accelerate
        <span className="block">Your Deployments</span>
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-center text-base md:text-lg text-white/70 font-normal">
        Tools to build, deploy, and scale your applications—built to elevate developer velocity and help teams ship faster.
      </p>

      {/* Grid */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 text-left">
        {/* Card 1: Track Performance */}
        <section className="group relative overflow-hidden rounded-3xl bg-white/[0.04] ring-1 ring-white/10 p-5 md:p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-transparent pointer-events-none"></div>
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl"></div>

          <div className="rounded-2xl bg-gradient-to-b from-white/5 to-white/[0.03] p-4 ring-1 ring-white/10 backdrop-blur">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-3">
              <BarChart3 className="h-4 w-4 text-sky-300" />
              <span className="font-medium">Live Deployment Metrics</span>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-5 w-5 rounded-full ring-1 ring-white/20 bg-sky-500/20">
                    <CheckCircle2 className="h-3 w-3 text-sky-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white/90">Build Success Rate</p>
                      <p className="text-xs text-white/60">Last 30 days</p>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500" style={{ width: '90%' }}></div>
                    </div>
                  </div>
                  <span className="text-xs text-white/70">90%</span>
                </div>
                <p className="mt-2 text-[11px] text-white/50">Production Environments</p>
              </div>

              <div className="rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-5 w-5 rounded-full ring-1 ring-white/20 bg-emerald-500/20">
                    <Clock className="h-3 w-3 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white/90">Avg. Build Time</p>
                      <p className="text-xs text-white/60">All frameworks</p>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  <span className="text-xs text-white/70">45s</span>
                </div>
                <p className="mt-2 text-[11px] text-white/50">Edge & Serverless</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button className="inline-flex items-center gap-2 rounded-full bg-sky-500/15 px-3 py-1.5 text-xs text-sky-200 ring-1 ring-sky-400/30 hover:bg-sky-500/20 transition">
                <Radar className="h-4 w-4" />
                System Insights
              </button>
              <div className="flex items-center gap-2 text-[11px] text-white/50">
                <Activity className="h-3.5 w-3.5 text-emerald-300" />
                Live
              </div>
            </div>
          </div>

          <h3 className="mt-5 text-xl md:text-2xl font-semibold tracking-tight text-white">Real-Time Telemetry</h3>
          <p className="mt-1.5 text-sm text-white/70">
            See build times, success rates, and active deployments as they happen. Make confident decisions with instant insight.
          </p>
        </section>

        {/* Card 2: Sell Without Borders -> Deploy Anywhere */}
        <section className="group relative overflow-hidden rounded-3xl bg-white/[0.04] ring-1 ring-white/10 p-5 md:p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent pointer-events-none"></div>
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl"></div>

          <div className="rounded-2xl bg-gradient-to-b from-white/5 to-white/[0.03] p-4 ring-1 ring-white/10 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Globe2 className="h-4 w-4 text-indigo-300" />
                <span className="font-medium">Universal Support</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-white/60">Anywhere</span>
                <Repeat className="h-4 w-4 text-white/40" />
              </div>
            </div>

            <div className="overflow-hidden h-36 rounded-xl ring-white/10 ring-1 mt-3">
              <ul ref={listRef} className="relative">
                {/* Double the list for infinite scroll effect */}
                {[...clients, ...clients].map((client, i) => {
                  const Icon = client.icon;
                  return (
                    <li key={i} className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <img src={client.img} className="h-6 w-6 rounded-full ring-1 ring-white/20" alt="app" />
                        <div>
                          <p className="text-sm text-white/90">{client.name}</p>
                          <p className="text-[11px] text-white/50">{client.loc}</p>
                        </div>
                      </div>
                      <Icon className={`h-4 w-4 ${client.color}`} />
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[11px] text-white/60">
              <Languages className="h-3.5 w-3.5" />
              Multi-language + auto-detection support
            </div>
          </div>

          <h3 className="mt-5 text-xl md:text-2xl font-semibold tracking-tight text-white">Deploy Anywhere</h3>
          <p className="mt-1.5 text-sm text-white/70">
            Support for Node.js, Python, Go, and more. Our containerization engine detects your stack automatically.
          </p>
        </section>

        {/* Card 3: Collaborate Seamlessly -> Seamless Integration */}
        <section
          ref={card3Ref}
          onMouseMove={handleCard3MouseMove}
          onMouseLeave={handleCard3MouseLeave}
          className="group relative overflow-hidden rounded-3xl bg-white/[0.04] ring-1 ring-white/10 p-5 md:p-6 transition-transform duration-200 ease-out"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent pointer-events-none"></div>
          <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl"></div>

          <div className="rounded-2xl bg-gradient-to-b from-white/5 to-white/[0.03] p-4 ring-1 ring-white/10 backdrop-blur">
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <Boxes className="h-4 w-4 text-emerald-300" />
              <span className="font-medium">Connects with your stack</span>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-3">
              <div className="flex flex-col items-center gap-2 rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10">
                <Github className="h-5 w-5 text-white/80" />
                <span className="text-xs text-white/70">Git</span>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10">
                <Layers className="h-5 w-5 text-white/80" />
                <span className="text-xs text-white/70">Docker</span>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10">
                <Zap className="h-5 w-5 text-white/80" />
                <span className="text-xs text-white/70">AWS</span>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10">
                <Database className="h-5 w-5 text-white/80" />
                <span className="text-xs text-white/70">Redis</span>
              </div>
            </div>

            <div className="mt-3 overflow-hidden rounded-xl bg-white/[0.04] ring-1 ring-white/10">
              <div className="relative grid grid-cols-6 gap-2 p-3">
                <div className="h-2 rounded-full bg-white/10 col-span-2"></div>
                <div className="h-2 rounded-full bg-white/10 col-span-3"></div>
                <div className="h-2 rounded-full bg-white/10 col-span-1"></div>
                <div className="h-2 rounded-full bg-white/10 col-span-4"></div>
                <div className="h-2 rounded-full bg-white/10 col-span-2"></div>
                <div ref={shimmerRef} className="absolute inset-y-0 -left-1 w-24 bg-gradient-to-r from-transparent via-white/15 to-transparent"></div>
              </div>
              <div className="flex items-center gap-2 border-t border-white/10 px-3 py-2">
                <Box className="h-4 w-4 text-white/60" />
                <span className="ml-1 text-[11px] text-white/60">Fully managed infrastructure</span>
              </div>
            </div>
          </div>

          <h3 className="mt-5 text-xl md:text-2xl font-semibold tracking-tight text-white">Seamless Integration</h3>
          <p className="mt-1.5 text-sm text-white/70">
            Keep your infrastructure aligned with native integrations for Git, Docker, AWS, and Redis—all in one place.
          </p>
        </section>

        {/* Card 4: Automate Workflows */}
        <section className="group relative overflow-hidden rounded-3xl bg-white/[0.04] ring-1 ring-white/10 p-5 md:p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 via-transparent to-transparent pointer-events-none"></div>
          <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl"></div>

          <div className="rounded-2xl bg-gradient-to-b from-white/5 to-white/[0.03] p-4 ring-1 ring-white/10 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Workflow className="h-4 w-4 text-fuchsia-300" />
                <span className="font-medium">Project Workspace</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={addMember} className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[11px] text-white/80 ring-1 ring-white/10 hover:bg-white/10 transition">
                  <UserPlus className="h-3.5 w-3.5" />
                  Deploy
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs">
              <button className="rounded-full bg-white/10 px-2 py-1 text-white/90 ring-1 ring-white/10">Services</button>
              <button className="rounded-full bg-transparent px-2 py-1 text-white/60 ring-1 ring-white/10">Builds</button>
              <button className="rounded-full bg-transparent px-2 py-1 text-white/60 ring-1 ring-white/10">Settings</button>
            </div>

            <div className="mt-3 space-y-2 max-h-[170px] overflow-hidden relative">
              {members.map((member, i) => {
                const Icon = member.icon;
                return (
                  <div 
                    key={i} 
                    className={`flex items-center justify-between rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10 ${member.isNew ? 'animate-in slide-in-from-top-2 fade-in duration-300' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full ring-1 ring-white/20 overflow-hidden bg-white/10 flex items-center justify-center">
                        <Terminal className="h-3.5 w-3.5 text-white/70" />
                      </div>
                      <div>
                        <p className="text-sm text-white/90">{member.name}</p>
                        <p className="text-[11px] text-white/50">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-white/60">
                      <Icon className="h-3.5 w-3.5" />
                      {member.action}
                    </div>
                  </div>
                )
              })}
              {/* Fade out bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#111] to-transparent"></div>
            </div>
          </div>

          <h3 className="mt-5 text-xl md:text-2xl font-semibold tracking-tight text-white">Automated Workflows</h3>
          <p className="mt-1.5 text-sm text-white/70">
            Automate webhooks, builds, and container handoffs so your team can focus on writing code, not managing servers.
          </p>
        </section>
      </div>
      </div>
    </section>
  );
}
