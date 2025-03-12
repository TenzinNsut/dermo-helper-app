
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <header className="py-4 px-6 glass-morphism z-10 sticky top-0 animate-fade-in">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          {!isHomePage && (
            <button 
              onClick={() => navigate(-1)}
              className="mr-4 p-2 rounded-full hover:bg-secondary focus-ring"
              aria-label="Go back"
            >
              <ArrowLeft size={20} className="text-foreground" />
            </button>
          )}
          
          <h1 className="text-lg font-medium">
            {isHomePage ? 'Skin Scan' : 
              location.pathname.includes('/camera') ? 'Capture Image' : 
              location.pathname.includes('/results') ? 'Analysis Results' : 
              'Skin Scan'}
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
