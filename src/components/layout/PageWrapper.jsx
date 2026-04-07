import React from 'react';

export const PageWrapper = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <header className="mb-12 text-center">
        <h1 className="text-5xl md:text-7xl font-heading font-bold text-white uppercase tracking-tighter drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          Pixel Palace
        </h1>
        <p className="text-esports-accent tracking-[0.3em] font-body text-sm mt-2 font-bold uppercase">
          Centralized Portal
        </p>
      </header>
      <main className="flex-grow flex flex-col items-center">
        {children}
      </main>
      <footer className="mt-20 py-8 text-center text-gray-500 font-body text-xs tracking-widest uppercase border-t border-white/10 w-full max-w-4xl mx-auto">
        &copy; {new Date().getFullYear()} Pixel Palace. All Rights Reserved.
      </footer>
    </div>
  );
};
