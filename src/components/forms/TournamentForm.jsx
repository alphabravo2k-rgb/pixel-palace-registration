import React, { useState, useEffect } from 'react';
import { useFormSubmit } from '../../hooks/useFormSubmit';
import { validateInviteCode } from '../../services/sheets';
import { Key, Users, Tag, Globe, Image as ImageIcon, MessageSquare, Gamepad2, Crosshair, Award, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export const TournamentForm = ({ tournament }) => {
  const { submit, isSubmitting, error, isSuccess } = useFormSubmit(tournament.id);
  const [formData, setFormData] = useState({});
  const [subActive, setSubActive] = useState(false);
  const [inviteStatus, setInviteStatus] = useState("AWAITING INPUT..."); // AWAITING, QUERYING, PRIORITY, OPEN

  const hasSubs = tournament.substitutes && tournament.substitutes.max > 0;
  const totalPlayers = tournament.playersPerTeam + (subActive ? 1 : 0);

  useEffect(() => {
    // Reset formData rank default to 5
    const initialData = {};
    for (let i = 1; i <= tournament.playersPerTeam + (hasSubs ? tournament.substitutes.max : 0); i++) {
       initialData[`p${i}Rank`] = "5";
    }
    setFormData(prev => ({ ...initialData, ...prev }));
  }, [tournament]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleInviteBlur = async (e) => {
    const code = e.target.value.trim();
    if (!code) {
      setInviteStatus("AWAITING INPUT...");
      return;
    }
    setInviteStatus("QUERYING...");
    try {
      const res = await validateInviteCode(tournament.id, code);
      if (res.valid) setInviteStatus("PRIORITY SLOT");
      else setInviteStatus("OPEN SLOT");
    } catch(err) {
      setInviteStatus("AWAITING INPUT...");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let idempotencyKey = sessionStorage.getItem('pp_idemp_key');
    if (!idempotencyKey) {
      idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      sessionStorage.setItem('pp_idemp_key', idempotencyKey);
    }
    
    // Build payload mapping exact required fields
    const payload = {
      idempotencyKey,
      subCount: subActive ? 1 : 0,
      ...formData
    };

    const result = await submit(payload);
    if(result.success) {
      sessionStorage.removeItem('pp_idemp_key');
    }
  };

  if (isSuccess) {
    return (
      <div className="glass-panel p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-neon-cyan blur-[30px] opacity-30 rounded-full"></div>
            <CheckCircle2 className="w-24 h-24 text-neon-cyan relative z-10" />
        </div>
        <h2 className="text-6xl font-black text-white mb-4 font-heading drop-shadow-[0_0_20px_rgba(0,240,255,0.4)]">
          ROSTER SECURED
        </h2>
        <p className="text-zinc-400 text-xl font-body uppercase tracking-widest">
          Registration confirmed. Check the Live Roster Tracker.
        </p>
      </div>
    );
  }

  const renderPlayerCard = (i, isSub = false) => {
    const isHidden = isSub && !subActive;
    let title = "STARTER";
    if (i === 1) title = "CAPTAIN";
    else if (tournament.playersPerTeam === 2 && i === 2) title = "PARTNER";
    if (isSub) title = "SUBSTITUTE";

    const accentDot = i === 1 ? "bg-yellow-400" : (isSub ? "bg-neon-pink" : "bg-white");
    const accentText = i === 1 ? "text-yellow-400" : (isSub ? "text-neon-pink" : "text-white");
    const bgLine = i === 1 ? "bg-yellow-500" : (isSub ? "bg-neon-pink" : "bg-white");

    return (
      <div key={`p${i}`} className={`bg-gradient-to-b from-gray-900/80 to-black border border-white/5 rounded-md relative overflow-hidden transition-all duration-300 hover:border-white/15 hover:-translate-y-1 shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-6 ${isHidden ? 'hidden opacity-0' : 'opacity-100'}`}>
        <div className={`absolute top-0 left-0 w-full h-[3px] opacity-70 ${bgLine}`}></div>
        <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 font-body">Player 0{i}</span>
            <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${accentDot} animate-pulse`}></div>
                <span className={`text-xs font-bold uppercase tracking-widest font-body ${accentText}`}>{title}</span>
            </div>
        </div>

        <div className="space-y-4">
            <div className="input-group">
                <MessageSquare />
                <input type="text" name={`p${i}Discord`} required={!isHidden} value={formData[`p${i}Discord`] || ''} onChange={handleChange} placeholder="Discord Username (e.g. s1mple)" className="input-ghost" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                    <Gamepad2 />
                    <input type="url" name={`p${i}Steam`} required={!isHidden} value={formData[`p${i}Steam`] || ''} onChange={handleChange} placeholder="Steam URL" className="input-ghost" />
                </div>
                <div className="input-group">
                    <Crosshair />
                    <input type="url" name={`p${i}Faceit`} required={!isHidden} value={formData[`p${i}Faceit`] || ''} onChange={handleChange} placeholder="FACEIT URL" className="input-ghost" />
                </div>
            </div>
            <div className="bg-black/40 border-b-2 border-white/10 rounded-t p-2 px-3 hover:bg-neon-cyan/5 hover:border-neon-cyan transition-colors">
                <div className="flex justify-between items-center w-full mb-2">
                    <div className="flex items-center gap-2 text-zinc-400">
                        <Award className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] font-body">FACEIT Level</span>
                    </div>
                    <span className="text-xl font-heading text-neon-cyan drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">{formData[`p${i}Rank`] || '5'}</span>
                </div>
                <input type="range" name={`p${i}Rank`} min="1" max="10" value={formData[`p${i}Rank`] || '5'} onChange={handleChange} className="cyber-slider" />
            </div>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      
      {/* SECTION 01 - TEAM IDENTITY */}
      <div className="glass-panel p-0 overflow-hidden">
        <div className="flex items-stretch bg-black/50 border-b border-white/10">
          <div className="bg-neon-purple px-5 flex items-center justify-center font-bold font-heading text-3xl text-white italic">01</div>
          <h2 className="text-3xl text-white font-heading tracking-wider pl-6 py-4 flex-grow italic">TEAM IDENTITY</h2>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {tournament.fields.includes('inviteCode') && (
            <div className="col-span-full relative mb-2">
              <div className="absolute -left-4 top-0 w-1 h-full bg-neon-pink shadow-[0_0_10px_rgba(240,0,255,0.5)]"></div>
              <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-neon-pink font-body">Invite Code (Optional — unlocks priority slot)</label>
                  <span className={`text-[10px] font-bold uppercase font-body ${inviteStatus === 'PRIORITY SLOT' ? 'text-neon-cyan' : 'text-zinc-500'}`}>
                    {inviteStatus === 'QUERYING...' ? <span className="text-yellow-500 animate-pulse">{inviteStatus}</span> : inviteStatus}
                  </span>
              </div>
              <div className="input-group">
                  <Key />
                  <input type="text" name="inviteCode" onBlur={handleInviteBlur} onChange={handleChange} value={formData.inviteCode || ''} placeholder="Leave blank if none" className="input-ghost" />
              </div>
            </div>
          )}
          
          <div className="col-span-full">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 block font-body">Team Name</label>
              <div className="input-group">
                  <Users />
                  <input type="text" name="teamName" required value={formData.teamName || ''} onChange={handleChange} placeholder="e.g. Natus Vincere" className="input-ghost text-lg" />
              </div>
          </div>
          
          <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 block font-body">Team Tag</label>
              <div className="input-group">
                  <Tag />
                  <input type="text" name="teamTag" required pattern="[A-Za-z0-9]+" title="Letters/numbers only" value={formData.teamTag || ''} onChange={handleChange} placeholder="e.g. NAVI" className="input-ghost" />
              </div>
          </div>
          
          <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 block font-body">Server Region</label>
              <div className="input-group">
                  <Globe />
                  <select name="teamRegion" required value={formData.teamRegion || ''} onChange={handleChange} className="input-ghost appearance-none cursor-pointer">
                      <option value="" disabled>Select Region...</option>
                      <option value="IND" className="bg-black">India (IND)</option>
                      <option value="PAK" className="bg-black">Pakistan (PAK)</option>
                      <option value="ME" className="bg-black">Middle East (ME)</option>
                  </select>
              </div>
          </div>
          
          <div className="col-span-full">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 block font-body">Team Logo URL</label>
              <div className="input-group">
                  <ImageIcon />
                  <input type="url" name="logoLink" required value={formData.logoLink || ''} onChange={handleChange} placeholder="https://i.imgur.com/yourlogo.png" className="input-ghost" />
              </div>
          </div>
        </div>
      </div>

      {/* SECTION 02 - TEAM ROSTER */}
      <div className="glass-panel p-0 overflow-hidden">
        <div className="flex items-stretch justify-between bg-black/50 border-b border-white/10 pr-6">
          <div className="flex items-stretch">
              <div className="bg-neon-cyan px-5 flex items-center justify-center font-bold font-heading text-3xl text-black italic">02</div>
              <h2 className="text-3xl text-white font-heading tracking-wider pl-6 py-4 italic">TEAM ROSTER</h2>
          </div>
          {hasSubs && (
            <div onClick={() => setSubActive(!subActive)} className="flex items-center gap-3 bg-neon-purple/20 px-5 py-3 rounded border border-neon-purple/50 cursor-pointer group transition-all shadow-[0_0_15px_rgba(138,43,226,0.3)] my-auto animate-pulse-fast">
                <Users className="w-5 h-5 text-neon-pink" />
                <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-white font-body drop-shadow-md">Add Substitute</span>
                <div className={`relative w-12 h-6 rounded-full border border-white/20 transition-colors duration-300 ml-2 ${subActive ? 'bg-neon-cyan' : 'bg-black'}`}>
                    <div className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${subActive ? 'translate-x-[24px] bg-white' : 'bg-zinc-400'}`}></div>
                </div>
            </div>
          )}
        </div>
        <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: tournament.playersPerTeam }).map((_, idx) => renderPlayerCard(idx + 1))}
                {hasSubs && Array.from({ length: tournament.substitutes.max }).map((_, idx) => renderPlayerCard(tournament.playersPerTeam + idx + 1, true))}
            </div>
        </div>
      </div>

      {/* SECTION 03 - FINAL VERIFICATION */}
      <div className="glass-panel p-0 overflow-hidden">
        <div className="flex items-stretch bg-black/50 border-b border-white/10">
          <div className="bg-white px-5 flex items-center justify-center font-bold font-heading text-3xl text-black italic">03</div>
          <h2 className="text-3xl text-white font-heading tracking-wider pl-6 py-4 flex-grow italic">FINAL VERIFICATION</h2>
        </div>
        <div className="p-8">
            <div className="mb-6">
                <span className="text-sm text-neon-pink uppercase tracking-widest font-bold font-body">We confirm that:</span>
            </div>

            <div className="space-y-4 mb-10 font-body">
                <label className="flex items-center gap-4 p-5 bg-black/50 border border-white/5 cursor-pointer hover:border-neon-cyan transition-colors group rounded shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                    <input type="checkbox" required className="w-5 h-5 accent-neon-cyan rounded-sm flex-shrink-0 cursor-pointer" />
                    <span className="text-sm text-zinc-400 group-hover:text-white transition-colors leading-relaxed">
                        <strong>MANDATORY ANTI-CHEAT</strong> — Our {tournament.playersPerTeam === 2 ? 'duo' : 'team'} acknowledges that Akros Anti-Cheat must be installed by all <strong className="text-neon-cyan">{totalPlayers}</strong> players.
                    </span>
                </label>
                <label className="flex items-center gap-4 p-5 bg-black/50 border border-white/5 cursor-pointer hover:border-neon-cyan transition-colors group rounded shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                    <input type="checkbox" required className="w-5 h-5 accent-neon-cyan rounded-sm flex-shrink-0 cursor-pointer" />
                    <span className="text-sm text-zinc-400 group-hover:text-white transition-colors leading-relaxed">
                        <strong>COMMUNICATION</strong> — {tournament.playersPerTeam === 2 ? 'Both' : 'All'} players have joined the Pixel Palace Discord server.
                    </span>
                </label>
                <label className="flex items-center gap-4 p-5 bg-black/50 border border-white/5 cursor-pointer hover:border-neon-cyan transition-colors group rounded shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                    <input type="checkbox" required className="w-5 h-5 accent-neon-cyan rounded-sm flex-shrink-0 cursor-pointer" />
                    <span className="text-sm text-zinc-400 group-hover:text-white transition-colors leading-relaxed">
                        <strong>SCHEDULE</strong> — We confirm availability for the registration deadline and tournament dates.
                    </span>
                </label>
            </div>

            {error && (
              <div className="mb-8 border border-red-500 bg-red-950/80 p-4 text-red-400 text-sm font-bold uppercase tracking-widest text-center shadow-[0_0_20px_rgba(239,68,68,0.3)] font-body flex items-center justify-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span>{error}</span>
              </div>
            )}
            
            <button type="submit" disabled={isSubmitting} className="btn-ignite w-full flex justify-center items-center h-[72px]">
                {isSubmitting ? (
                  <span><Loader2 className="w-6 h-6 inline animate-spin mr-2 mb-1" /> TRANSMITTING...</span>
                ) : (
                  <span>SUBMIT REGISTRATION</span>
                )}
            </button>
        </div>
      </div>
    </form>
  );
};
