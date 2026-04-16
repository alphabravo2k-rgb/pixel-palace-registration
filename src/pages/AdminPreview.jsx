import React, { useEffect } from 'react';
import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import { getTournamentBySlug } from '../config/tournaments';
import { Register } from './Register';

export const AdminPreview = () => {
  const { tournamentSlug } = useParams();
  const [searchParams] = useSearchParams();
  const tournament = getTournamentBySlug(tournamentSlug);
  
  if (!tournament) return <Navigate to="/404" replace />;
  
  const secretKey = searchParams.get('key');
  const configuredKey = tournament.adminPreviewKey || "pixel-palace-internal-2026";
  
  if (secretKey !== configuredKey) {
    return <Navigate to="/404" replace />;
  }

  const handlePreFill = () => {
    // Custom event picked up by TournamentForm to auto-populate the hook-form payload
    window.dispatchEvent(new CustomEvent('admin-mock-fill'));
  };

  return (
    <div className="relative">
      {/* NON-DISMISSABLE BANNER */}
      <div className="fixed top-0 left-0 w-full bg-yellow-500 text-black font-body tracking-wider uppercase z-[9999] flex justify-between items-center px-6 py-3 shadow-[0_5px_30px_rgba(234,179,8,0.3)]">
        <div className="font-bold flex items-center gap-4">
          <span className="text-lg font-heading tracking-widest bg-black text-yellow-500 px-3 py-1">PREVIEW MODE</span>
          <span className="text-sm font-bold opacity-90 hidden md:inline">
            ADMIN PREVIEW — Submissions are mocked, not sent to Sheet
          </span>
        </div>
        <button 
          onClick={handlePreFill}
          className="bg-black text-white px-5 py-2 text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors border border-black/20 shadow-md"
        >
          FILL WITH MOCK DATA
        </button>
      </div>
      
      <div className="pt-16">
        <Register />
      </div>
    </div>
  );
};
