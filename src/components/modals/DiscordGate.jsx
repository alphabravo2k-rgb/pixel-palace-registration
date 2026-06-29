import React, { useState, useEffect } from 'react';
import { MessageCircle, ExternalLink, ShieldCheck, ShieldAlert, Award } from 'lucide-react';

export const DiscordGate = ({ tournament }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [shake, setShake] = useState(false);

  const isArchived = tournament?.status === 'ARCHIVED';
  const storageKey = `_pp_rules_auth_${tournament?.id}`;

  // Parse verification items from the tournament config
  const verificationItems = tournament?.customVerification
    ? tournament.customVerification.map((str, i) => {
        const parts = str.split(' — ');
        return {
          key: `custom-${i}`,
          label: parts[0],
          body: parts.length > 1 ? parts.slice(1).join(' — ') : ''
        };
      })
    : [
        {
          key: 'anticheat',
          label: 'MANDATORY ANTI-CHEAT',
          body: `Our team acknowledges that Akros Anti-Cheat must be installed by all players.`,
        },
        {
          key: 'discord',
          label: 'COMMUNICATION',
          body: `All players have joined the Pixel Palace Discord server.`,
        },
        {
          key: 'schedule',
          label: 'SCHEDULE',
          body: `We confirm availability for the registration deadline and all tournament dates.`,
        },
      ];

  const [checkedStates, setCheckedStates] = useState(
    Array(verificationItems.length).fill(false)
  );

  useEffect(() => {
    // Archived tournaments skip the rules gate entirely
    if (isArchived) return;
    
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
      try {
        const { token, timestamp } = JSON.parse(stored);
        const ONE_DAY = 24 * 60 * 60 * 1000;
        const isExpired = Date.now() - timestamp > ONE_DAY;
        const expectedToken = btoa(`${tournament.id}-rules-auth`);
        
        if (token === expectedToken && !isExpired) return;
      } catch (e) {
        // malformed data
      }
    }
    setIsOpen(true);
  }, [tournament, storageKey, isArchived]);

  const allChecked = checkedStates.every(v => v === true);

  const handleCheckboxChange = (index, value) => {
    setCheckedStates(prev => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const handleProceed = () => {
    if (allChecked) {
      const token = btoa(`${tournament.id}-rules-auth`);
      const payload = { token, timestamp: Date.now() };
      sessionStorage.setItem(storageKey, JSON.stringify(payload));
      setIsOpen(false);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#030305]/95 backdrop-blur-lg p-4 overflow-y-auto">
      <div 
        className={`bg-zinc-950 border border-neon-cyan/20 rounded-sm p-6 md:p-8 max-w-2xl w-full my-8 relative overflow-hidden shadow-[0_0_80px_rgba(0,240,255,0.08)] ${shake ? 'animate-shake' : ''}`}
      >
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink"></div>
        <div className="hud-crosshair tl"></div><div className="hud-crosshair tr"></div><div className="hud-crosshair bl"></div><div className="hud-crosshair br"></div>
        
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-neon-cyan/10 border border-neon-cyan/40 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            <Award className="w-8 h-8 text-neon-cyan" />
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-heading text-white text-center uppercase tracking-[0.15em] leading-tight mb-2">
          TOURNAMENT GATEWAY
        </h2>
        <p className="text-zinc-500 text-xs text-center font-body uppercase tracking-[0.2em] mb-6">
          Pixel Palace Community Cup 2 // Rules & Agreements
        </p>
        
        <div className="bg-black/40 border border-white/5 p-5 rounded-sm mb-6">
          <h3 className="text-xs font-bold font-heading text-white uppercase tracking-widest mb-3 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-neon-purple" /> Discord Integration Required
          </h3>
          <p className="text-zinc-400 text-xs font-body leading-relaxed mb-4">
            Match lobbies, check-ins, and direct admin coordination will be managed strictly on our Discord server. All players must be present inside the server.
          </p>
          <a 
            href={tournament?.discordInviteUrl || "https://discord.gg/y6ZW8jHn2Q"} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold uppercase tracking-widest rounded-sm transition-colors shadow-lg"
          >
            Join Discord Server <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="space-y-4 mb-8">
          <div className="text-[10px] font-black font-body text-neon-pink uppercase tracking-widest mb-2">
            Acknowledge & Confirm Roster Rules:
          </div>
          
          {verificationItems.map((item, i) => (
            <label
              key={item.key}
              className={`flex items-start gap-4 p-4 bg-black/60 border rounded-sm cursor-pointer transition-all duration-300 ${
                checkedStates[i] 
                  ? 'border-neon-cyan/40 bg-neon-cyan/5 shadow-[inset_0_0_15px_rgba(0,240,255,0.03)]' 
                  : 'border-white/5 hover:border-white/15'
              }`}
            >
              <input 
                type="checkbox" 
                className="mt-1 w-5 h-5 accent-neon-cyan flex-shrink-0 cursor-pointer"
                checked={checkedStates[i]}
                onChange={(e) => handleCheckboxChange(i, e.target.checked)}
              />
              <span className="text-xs text-zinc-400 leading-relaxed font-body group-hover:text-white transition-colors">
                <strong className="text-white uppercase tracking-wider block mb-0.5">{item.label}</strong>
                {item.body}
              </span>
            </label>
          ))}
        </div>

        <button 
          onClick={handleProceed}
          className={`w-full py-4 font-bold uppercase tracking-widest text-xs transition-all duration-300 rounded-sm ${
            allChecked 
              ? 'bg-neon-cyan text-black hover:bg-white hover:text-black shadow-[0_0_25px_rgba(0,240,255,0.3)] cursor-pointer' 
              : 'bg-zinc-900/50 text-zinc-600 cursor-not-allowed border border-zinc-800/50'
          }`}
        >
          {allChecked ? 'Proceed to Registration Form' : 'Acknowledge all requirements to proceed'}
        </button>

        {!allChecked && (
          <div className="mt-4 flex items-center justify-center gap-2 text-yellow-500/70 text-[9px] font-bold uppercase tracking-widest">
            <ShieldAlert className="w-3.5 h-3.5" /> Agreement verification required to unlock registration page
          </div>
        )}
      </div>
    </div>
  );
};
