import React from 'react';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  onBack?: () => void;
  currentTab?: 'novels' | 'manga';
  setView?: (view: ViewState) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, title, onBack, currentTab, setView }) => {
  return (
    <div className="min-h-screen flex flex-col items-center p-6 md:p-12 relative">
      <header className="w-full max-w-6xl mb-8 flex flex-col md:flex-row items-center justify-between gap-8 z-10">
        <div className="flex items-center gap-6">
          {onBack && (
            <button 
              onClick={onBack}
              className="sketch-btn p-3 bg-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          <div>
            <h1 className="sketch-font text-5xl md:text-7xl text-gray-800 tracking-tight">
              Draft<span className="text-blue-500">World</span>
            </h1>
          </div>
        </div>

        <div className="relative">
            <div className="rough-border bg-white px-8 py-3 sketch-font text-2xl -rotate-1 shadow-md min-w-[200px] text-center">
                {title}
            </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      {setView && (
        <div className="w-full max-w-6xl mb-12 flex gap-2 border-b-2 border-gray-200">
          <button 
            onClick={() => setView('shelf')}
            className={`px-8 py-3 sketch-font text-xl transition-all border-x-2 border-t-2 border-transparent -mb-[2px] ${currentTab === 'novels' ? 'bg-white border-gray-400 rounded-t-xl z-10' : 'text-gray-400 opacity-60'}`}
          >
            草稿架 / NOVELS
          </button>
          <button 
            onClick={() => setView('gallery')}
            className={`px-8 py-3 sketch-font text-xl transition-all border-x-2 border-t-2 border-transparent -mb-[2px] ${currentTab === 'manga' ? 'bg-white border-gray-400 rounded-t-xl z-10' : 'text-gray-400 opacity-60'}`}
          >
            漫畫箱 / SKETCHES
          </button>
        </div>
      )}

      <main className="w-full max-w-6xl z-10 flex-grow">
        {children}
      </main>

      <footer className="mt-32 w-full text-center py-8 opacity-40 grayscale pointer-events-none">
        <p className="sketch-font text-lg">--- END OF NOTES ---</p>
      </footer>
    </div>
  );
};

export default Layout;