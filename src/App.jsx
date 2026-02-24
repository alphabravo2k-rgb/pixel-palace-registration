import { ShieldAlert } from 'lucide-react';
import { HashRouter, Link, Route, Routes } from 'react-router-dom';

import { TournamentHub } from './pages/TournamentHub';

export const API_URL = 'https://script.google.com/macros/s/AKfycbxZRahhIuVNNbxqvsdfDSt6X9SaciMARwVeSXkjMSpzEoegrF_F4vqWG5HXYu50z1RM/exec';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-bg font-sans text-zinc-300 relative">
      {/* COMP-OS Visual Engine Layers */}
      <div className="fixed inset-0 z-[-3] bg-gradient-radial from-brand-dim/20 via-bg to-bg opacity-70" />
      <div className="fixed inset-0 z-[-2] bg-noise opacity-10 mix-blend-overlay pointer-events-none" />
      <div className="fixed inset-0 z-[-1] bg-vignette pointer-events-none" />

      {/* Global Header */}
      <header className="text-center pt-12 pb-6 flex flex-col items-center relative z-20">
        <Link to="/">
          <img 
            alt="Pixel Palace" 
            className="w-48 h-48 drop-shadow-neon transition-transform hover:scale-105" 
            src="https://raw.githubusercontent.com/alphabravo2k-rgb/pixel-palace-registration/1a7d90c43796fd037316bdaf4f3b4de9a485d615/image_4379f9.png" 
          />
        </Link>
      </header>

      {/* Dynamic Router Injection */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 flex-grow">
        {children}
      </main>

      {/* Global Footer */}
      <footer className="w-full bg-bg-panel border-t border-white/5 mt-20 py-12 relative z-10 shadow-glass">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
          <div className="flex items-center gap-5 justify-center md:justify-start">
            <img 
              alt="Logo Mark"
              className="w-16 h-16 opacity-40 grayscale" 
              src="https://raw.githubusercontent.com/alphabravo2k-rgb/pixel-palace-registration/1a7d90c43796fd037316bdaf4f3b4de9a485d615/image_4379f9.png" 
            />
            <div className="h-12 w-[2px] bg-white/10" />
            <div className="text-left">
              <h4 className="font-display text-3xl text-zinc-300 tracking-wider">PIXEL PALACE</h4>
              <p className="text-[9px] uppercase tracking-widest text-tactical-muted font-bold font-mono">© 2026 Sovereign Systems</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[8px] uppercase tracking-[0.5em] text-tactical-muted font-bold mb-2 font-mono">Engineered By</span>
            <span className="text-lg font-black tracking-[0.3em] uppercase text-zinc-400 font-display">
              BRAVO<span className="text-brand-accent">.</span>GG
            </span>
          </div>
          <div className="flex justify-center md:justify-end">
            <a className="flex items-center gap-4 px-6 py-3 glass-panel hover:border-brand-glow transition-all group" href="https://discord.gg/xGMZ5wrgUd" target="_blank" rel="noreferrer">
              <div className="bg-tactical p-2.5 rounded-sm group-hover:bg-brand/20 transition-colors">
                <ShieldAlert className="text-tactical-muted group-hover:text-brand-glow w-5 h-5 transition-colors" />
              </div>
              <div className="flex flex-col text-left font-mono">
                <span className="text-[9px] font-bold uppercase tracking-widest text-tactical-muted">Need Backup?</span>
                <span className="text-sm font-bold uppercase tracking-widest text-zinc-300 group-hover:text-white transition-colors">Contact Support</span>
              </div>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route element={<TournamentHub />} path="/:tournamentId" />
          <Route element={<div className="text-center font-display text-4xl mt-20 text-brand-glow">HOME ROUTE INACTIVE (USE /#/community-cup-2)</div>} path="/" />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
