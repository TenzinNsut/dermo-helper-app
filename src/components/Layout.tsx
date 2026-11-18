import React, { ReactNode } from "react";
import Header from "./Header";
import { ShieldCheck, Smartphone, ExternalLink, Github, Lock, HeartHandshake } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
  fullHeight?: boolean;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  hideHeader = false,
  fullHeight = false,
  className = "",
}) => {
  return (
    <div
      className={`min-h-screen flex flex-col bg-[#FAF9F6] text-black ${
        fullHeight ? "h-screen" : ""
      }`}
    >
      {!hideHeader && <Header />}

      <main
        className={`flex-1 px-4 sm:px-6 py-6 sm:py-8 w-full max-w-5xl mx-auto flex flex-col ${className}`}
      >
        {children}
      </main>

      <footer className="mt-auto border-t-2 border-black bg-white text-black text-xs py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Column 1: Brand & Overview */}
          <div className="md:col-span-2 space-y-2.5">
            <div className="flex items-center gap-2 text-black font-extrabold text-sm uppercase">
              <div className="w-6 h-6 bg-black text-white border-2 border-black flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span>DERMO-HELPER // SKIN SCREENING</span>
            </div>
            <p className="text-slate-700 leading-relaxed max-w-md text-xs font-medium">
              Open-source skin lesion screening powered by Multi-Attention Guided
              Knowledge Distillation (MAG-KD). Operates entirely inside client WebAssembly
              with zero cloud image uploads for absolute patient privacy.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 border-2 border-black bg-emerald-200 text-black text-[11px] font-mono font-bold uppercase shadow-[2px_2px_0px_#000]">
              <Lock className="w-3 h-3 text-black" />
              <span>100% OFFLINE // ZERO CLOUD TELEMETRY</span>
            </div>
          </div>

          {/* Column 2: Navigation & Sections */}
          <div className="space-y-2">
            <h4 className="font-mono font-bold text-black text-xs uppercase tracking-wider">
              // SECTIONS
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700 font-semibold">
              <li>
                <a href="#screening" className="hover:underline">
                  01. Screening Tool
                </a>
              </li>
              <li>
                <a href="#motivation" className="hover:underline">
                  02. Motivation & Objectives
                </a>
              </li>
              <li>
                <a href="#methodology" className="hover:underline">
                  03. MAG-KD Methodology
                </a>
              </li>
              <li>
                <a href="#conclusion" className="hover:underline">
                  04. Results & Conclusion
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Downloads & Repositories */}
          <div className="space-y-2">
            <h4 className="font-mono font-bold text-black text-xs uppercase tracking-wider">
              // DOWNLOADS
            </h4>
            <ul className="space-y-1.5 text-xs font-semibold">
              <li>
                <a
                  href="https://github.com/TenzinNsut/dermo-helper-app/releases/tag/DermoHelperAPK"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-black hover:underline font-bold"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Download Android APK</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/TenzinNsut/dermo-helper-app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-slate-700 hover:text-black hover:underline"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                </a>
              </li>
              <li>
                <a
                  href="https://dermo-helper-app.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-slate-700 hover:text-black hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Web App Deployment</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-5xl mx-auto pt-6 border-t-2 border-black flex flex-col sm:flex-row justify-between items-center gap-3 text-slate-700 font-mono text-[11px] font-semibold">
          <p>© {new Date().getFullYear()} DERMO-HELPER. OPEN SOURCE UNDER MIT LICENSE.</p>
          <p className="text-center sm:text-right">
            AUXILIARY SCREENING TOOL ONLY. DOES NOT REPLACE BIOPSY.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
