import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import OfflineReadyBadge from "@/components/OfflineReadyBadge";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <header className="py-3 sm:py-4 px-4 sm:px-6 glass-morphism z-10 sticky top-0 animate-fade-in">
      <div className="max-w-4xl mx-auto flex justify-between items-center gap-3">
        <div className="flex items-center min-w-0">
          {!isHomePage && (
            <button
              onClick={() => navigate(-1)}
              className="mr-3 sm:mr-4 p-1.5 sm:p-2 rounded-full hover:bg-secondary focus-ring"
              aria-label="Go back"
            >
              <ArrowLeft size={20} className="text-foreground" />
            </button>
          )}

          <h1 className="text-base sm:text-lg font-medium truncate">
            {isHomePage
              ? "Dermo Helper"
              : location.pathname.includes("/camera")
                ? "Capture Image"
                : location.pathname.includes("/results")
                  ? "Analysis Results"
                  : "Dermo Helper"}
          </h1>
        </div>

        {/* Offline Ready Indicator: Displays once model is compiled and resident in WASM memory */}
        <div className="flex items-center flex-shrink-0">
          <OfflineReadyBadge />
        </div>
      </div>
    </header>
  );
};

export default Header;
