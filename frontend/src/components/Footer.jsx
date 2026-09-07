import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#050505] border-t border-white/10 pt-24 pb-16 relative z-10">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row justify-between gap-20">
          <div className="max-w-[260px]">
            <div className="text-xl font-semibold tracking-tight text-white mb-5 font-jakarta">
              LaunchBase
            </div>

            <p className="text-sm text-white/50 font-light leading-relaxed">
              Deploy code to AWS Fargate in seconds. Zero config, fully automated CI/CD pipeline for your repositories.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-20 gap-y-12">
            <div>
              <h4 className="text-xs font-medium text-white/70 mb-5 uppercase tracking-widest font-mono">
                Product
              </h4>
              <ul className="space-y-3 text-sm font-light text-white/50">
                <li><a href="#" className="hover:text-[#00e599] transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-[#00e599] transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-[#00e599] transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-[#00e599] transition-colors">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-medium text-white/70 mb-5 uppercase tracking-widest font-mono">
                Resources
              </h4>
              <ul className="space-y-3 text-sm font-light text-white/50">
                <li><a href="#" className="hover:text-[#00e599] transition-colors">Guides</a></li>
                <li><a href="#" className="hover:text-[#00e599] transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-[#00e599] transition-colors">System Status</a></li>
                <li><a href="#" className="hover:text-[#00e599] transition-colors">GitHub</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-medium text-white/70 mb-5 uppercase tracking-widest font-mono">
                Infrastructure
              </h4>
              <ul className="space-y-3 text-sm font-light text-white/50">
                <li><a href="#" className="hover:text-[#00e599] transition-colors">AWS Fargate</a></li>
                <li><a href="#" className="hover:text-[#00e599] transition-colors">Docker</a></li>
                <li><a href="#" className="hover:text-[#00e599] transition-colors">Redis Queue</a></li>
                <li><a href="#" className="hover:text-[#00e599] transition-colors">Amazon ECR</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-medium text-white/70 mb-5 uppercase tracking-widest font-mono">
                Company
              </h4>
              <ul className="space-y-3 text-sm font-light text-white/50">
                <li><a href="#" className="hover:text-[#00e599] transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-[#00e599] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#00e599] transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-[#00e599] transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-20 pt-10 relative">
          <div className="w-full h-px relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            <div className="absolute left-1/2 -translate-x-1/2 w-72 h-px bg-gradient-to-r from-transparent via-[#00e599]/40 to-transparent drop-shadow-[0_0_8px_rgba(0,229,153,0.35)]"></div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-sm font-light text-white/40">
            <div>© 2026 LaunchBase. All rights reserved.</div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-xs">
              <a href="#" className="hover:text-[#00e599] transition-colors">GitHub</a>
              <a href="#" className="hover:text-[#00e599] transition-colors">Twitter / X</a>
              <a href="#" className="hover:text-[#00e599] transition-colors">Privacy</a>
              <a href="#" className="hover:text-[#00e599] transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
