import React from 'react';
import { useAudio } from '../../hooks/useAudio';

const TABS = ['ALL', 'LIVE', 'UPCOMING', 'ARCHIVED'];

export default function TournamentFilterTabs({ activeTab, onTabChange }) {
  const { playHover, playClick } = useAudio();

  return (
    <div className="flex justify-center md:justify-start gap-8 w-full border-b border-white/10 mb-8 relative">
      {TABS.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onMouseEnter={playHover}
            onClick={() => {
              playClick();
              onTabChange(tab);
            }}
            className={`pb-3 font-heading text-2xl tracking-widest uppercase transition-all duration-300 relative ${
              isActive 
                ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] font-black' 
                : 'text-zinc-500 hover:text-white/80'
            }`}
          >
            {tab}
            {isActive && (
              <div className="absolute bottom-0 left-0 w-full h-[3px] bg-neon-cyan shadow-[0_0_15px_rgba(0,240,255,1)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
