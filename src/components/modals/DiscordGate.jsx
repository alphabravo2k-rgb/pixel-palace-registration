import React, { useState, useEffect } from 'react';
import { MessageCircle, ExternalLink, ShieldAlert } from 'lucide-react';

export const DiscordGate = ({ tournament }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [shake, setShake] = useState(false);

  const isArchived = tournament?.status === 'ARCHIVED';
  const storageKey = `discord-gate-${tournament?.id}`;

  useEffect(() => {
    // Archived tournaments skip the Discord gate entirely — no registration happening
    if (isArchived) return;
    if (tournament?.discordRequired) {
      const hasPassed = localStorage.getItem(storageKey);
      if (!hasPassed) {
        setIsOpen(true);
      }
    }
  }, [tournament, storageKey, isArchived]);

  const handleProceed = () => {
    if (isChecked) {
      localStorage.setItem(storageKey, 'true');
      setIsOpen(false);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div 
        className={`bg-zinc-900 border border-neon-cyan/30 rounded-lg p-8 max-w-lg w-full relative overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.15)] ${shake ? 'animate-shake' : ''}`}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan to-neon-purple"></div>
        
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#5865F2]/20 border border-[#5865F2] flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-[#5865F2]" />
          </div>
        </div>

        <h2 className="text-3xl font-heading text-white text-center uppercase tracking-widest leading-tight mb-2">
          Discord Membership Required
        </h2>
        
        <p className="text-zinc-400 text-sm text-center font-body mb-8">
          To participate in <span className="text-white font-bold">{tournament?.name}</span>, all players must be physically present in the Pixel Palace Discord server for match coordination and VOIP.
        </p>

        <a 
          href={tournament?.discordInviteUrl || "https://discord.gg/y6ZW8jHn2Q"} 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold uppercase tracking-widest rounded transition-colors mb-8"
        >
          Join Discord Server <ExternalLink className="w-4 h-4" />
        </a>

        <div className="bg-black/50 border border-white/5 p-4 rounded mb-6">
          <label className="flex items-start gap-4 cursor-pointer group">
            <input 
              type="checkbox" 
              className="mt-1 w-5 h-5 accent-neon-cyan flex-shrink-0 cursor-pointer"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
            />
            <span className="text-sm text-zinc-300 font-body leading-relaxed group-hover:text-white transition-colors">
              I verify that my entire roster has joined the Discord server and we understand that walkovers will be issued for missing check-ins.
            </span>
          </label>
        </div>

        <button 
          onClick={handleProceed}
          className={`w-full py-4 font-bold uppercase tracking-widest text-sm transition-all duration-300 ${
            isChecked 
              ? 'bg-neon-cyan text-black hover:bg-white hover:text-black shadow-[0_0_20px_rgba(0,240,255,0.4)]' 
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
          }`}
        >
          {isChecked ? 'Proceed to Registration' : 'Acknowledge to Proceed'}
        </button>

        {!isChecked && (
           <div className="mt-4 flex items-center justify-center gap-2 text-yellow-500/80 text-[10px] font-bold uppercase tracking-widest">
              <ShieldAlert className="w-3 h-3" /> Action required to unlock page
           </div>
        )}
      </div>
    </div>
  );
};
