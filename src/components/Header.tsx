import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Smartphone, ExternalLink, Menu, X } from "lucide-react";
import OfflineReadyBadge from "@/components/OfflineReadyBadge";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (!isHomePage) {
      navigate(`/#${sectionId}`);
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="py-2.5 sm:py-3 px-4 sm:px-6 z-30 sticky top-0 border-b-2 border-black bg-white shadow-xs">
      <div className="max-w-5xl mx-auto flex justify-between items-center gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {!isHomePage && (
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 border-2 border-black bg-white hover:bg-black hover:text-white shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              aria-label="Go back"
            >
              <ArrowLeft size={16} />
            </button>
          )}

          <Link
            to="/"
            className="flex items-center gap-2 group py-1"
          >
            <div className="w-8 h-8 bg-black text-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000] group-hover:bg-yellow-300 group-hover:text-black transition-all">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold uppercase text-black tracking-tight leading-none">
                  DERMO-HELPER
                </span>
                <span className="hidden xs:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-black text-white">
                  MAG-KD // ONNX
                </span>
              </div>
              <span className="text-[10px] font-mono font-semibold text-slate-600 hidden sm:inline leading-tight">
                CLIENT-SIDE WASM SCREENING
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        {isHomePage && (
          <nav className="hidden md:flex items-center gap-1 text-xs font-mono font-bold uppercase text-black">
            <button
              onClick={() => scrollToSection("screening")}
              className="px-2.5 py-1 hover:bg-black hover:text-white border-2 border-transparent hover:border-black transition-none"
            >
              SCREENING
            </button>
            <button
              onClick={() => scrollToSection("motivation")}
              className="px-2.5 py-1 hover:bg-black hover:text-white border-2 border-transparent hover:border-black transition-none"
            >
              MOTIVATION
            </button>
            <button
              onClick={() => scrollToSection("methodology")}
              className="px-2.5 py-1 hover:bg-black hover:text-white border-2 border-transparent hover:border-black transition-none"
            >
              METHODOLOGY
            </button>
            <button
              onClick={() => scrollToSection("conclusion")}
              className="px-2.5 py-1 hover:bg-black hover:text-white border-2 border-transparent hover:border-black transition-none"
            >
              RESULTS
            </button>
            <button
              onClick={() => scrollToSection("download")}
              className="px-2.5 py-1 hover:bg-black hover:text-white border-2 border-transparent hover:border-black transition-none"
            >
              DOWNLOAD
            </button>
          </nav>
        )}

        {/* Right side CTAs & Offline Status */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {/* Offline Model Status Badge */}
          <OfflineReadyBadge />

          {/* Android APK Download Direct Button */}
          <a
            href="https://github.com/TenzinNsut/dermo-helper-app/releases/tag/DermoHelperAPK"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none sm:rounded-md text-xs font-mono font-bold uppercase bg-yellow-300 hover:bg-yellow-200 text-black border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            title="Download standalone Android APK for offline use"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>GET APK</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>

          {/* Mobile menu toggle button */}
          {isHomePage && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 border-2 border-black bg-white hover:bg-black hover:text-white shadow-[2px_2px_0px_#000]"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isHomePage && mobileMenuOpen && (
        <div className="md:hidden pt-3 pb-2 px-2 border-t-2 border-black mt-2.5 flex flex-col gap-1.5 font-mono text-xs font-bold uppercase">
          <button
            onClick={() => scrollToSection("screening")}
            className="text-left px-3 py-2 border-2 border-black hover:bg-black hover:text-white"
          >
            01 // SCREENING TOOL
          </button>
          <button
            onClick={() => scrollToSection("motivation")}
            className="text-left px-3 py-2 border-2 border-black hover:bg-black hover:text-white"
          >
            02 // MOTIVATION & OBJECTIVES
          </button>
          <button
            onClick={() => scrollToSection("methodology")}
            className="text-left px-3 py-2 border-2 border-black hover:bg-black hover:text-white"
          >
            03 // METHODOLOGY & MAG-KD
          </button>
          <button
            onClick={() => scrollToSection("conclusion")}
            className="text-left px-3 py-2 border-2 border-black hover:bg-black hover:text-white"
          >
            04 // RESULTS & CONCLUSION
          </button>
          <button
            onClick={() => scrollToSection("download")}
            className="text-left px-3 py-2 border-2 border-black hover:bg-black hover:text-white"
          >
            05 // DOWNLOAD ANDROID APP
          </button>
          <a
            href="https://github.com/TenzinNsut/dermo-helper-app/releases/tag/DermoHelperAPK"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-black bg-yellow-300 text-black font-bold uppercase shadow-[2px_2px_0px_#000]"
          >
            <Smartphone className="w-4 h-4" />
            <span>DOWNLOAD ANDROID APK</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </header>
  );
};

export default Header;
