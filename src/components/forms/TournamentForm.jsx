import React, { useState, useEffect, useMemo } from 'react';
import { useFormSubmit } from '../../hooks/useFormSubmit';
import { validateInviteCode } from '../../services/sheets';
import { getFieldMeta } from '../../utils/formFields';
import { Loader2, CheckCircle2, AlertTriangle, Users as UsersIcon } from 'lucide-react';

export const TournamentForm = ({ tournament }) => {
  const { submit, isSubmitting, error, isSuccess } = useFormSubmit(tournament.id);
  const [formData, setFormData] = useState({});
  const [subActive, setSubActive] = useState(false);
  const [inviteStatus, setInviteStatus] = useState("AWAITING INPUT...");

  const hasSubs = tournament.substitutes && tournament.substitutes.max > 0;
  const totalPlayers = tournament.playersPerTeam + (subActive ? 1 : 0);

  // Parse fields into groups
  const { teamFields, playerGroups } = useMemo(() => {
    const team = [];
    const players = {}; // { 1: [], 2: [], ... }

    tournament.fields.forEach(field => {
      const meta = getFieldMeta(field);
      if (meta.playerNum) {
        if (!players[meta.playerNum]) players[meta.playerNum] = [];
        players[meta.playerNum].push(field);
      } else {
        team.push(field);
      }
    });

    return { teamFields: team, playerGroups: players };
  }, [tournament]);

  useEffect(() => {
    const initialData = {};
    // Initialize ranks or other defaults
    tournament.fields.forEach(field => {
      if (field.endsWith('Rank')) initialData[field] = "5";
    });
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
      <div className="glass-panel p-16 text-center flex flex-col items-center justify-center min-h-[400px] animate-in fade-in zoom-in duration-500">
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-neon-cyan blur-[30px] opacity-30 rounded-full"></div>
            <CheckCircle2 className="w-24 h-24 text-neon-cyan relative z-10" />
        </div>
        <h2 className="text-6xl font-black text-white mb-4 font-heading drop-shadow-[0_0_20px_rgba(0,240,255,0.4)] uppercase">
          ROSTER SECURED
        </h2>
        <p className="text-zinc-400 text-xl font-body uppercase tracking-widest">
          Registration confirmed. Check the Live Roster Tracker.
        </p>
      </div>
    );
  }

  const renderField = (fieldName, isHidden = false) => {
    const meta = getFieldMeta(fieldName);
    const Icon = meta.icon;

    if (meta.type === 'select') {
      return (
        <div key={fieldName} className="col-span-1">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 block font-body">{meta.label}</label>
          <div className="input-group">
            {Icon && <Icon />}
            <select name={fieldName} required={!isHidden} value={formData[fieldName] || ''} onChange={handleChange} className="input-ghost appearance-none cursor-pointer">
              <option value="" disabled>{meta.placeholder}</option>
              {meta.options.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-black">{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      );
    }

    if (meta.type === 'range') {
      return (
        <div key={fieldName} className="bg-black/40 border-b-2 border-white/10 rounded-t p-2 px-3 hover:bg-neon-cyan/5 hover:border-neon-cyan transition-colors">
          <div className="flex justify-between items-center w-full mb-2">
            <div className="flex items-center gap-2 text-zinc-400">
              {Icon && <Icon className="w-4 h-4" />}
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] font-body">{meta.label}</span>
            </div>
            <span className="text-xl font-heading text-neon-cyan drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">{formData[fieldName] || '5'}</span>
          </div>
          <input type="range" name={fieldName} min={meta.min} max={meta.max} value={formData[fieldName] || '5'} onChange={handleChange} className="cyber-slider" />
        </div>
      );
    }

    return (
      <div key={fieldName} className={meta.label.includes('Name') || meta.label.includes('Logo') || fieldName === 'inviteCode' ? 'col-span-full' : 'col-span-1'}>
        {fieldName !== 'inviteCode' && (
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 block font-body">{meta.label}</label>
        )}
        {fieldName === 'inviteCode' && (
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-neon-pink font-body">Invite Code (Optional)</label>
            <span className={`text-[10px] font-bold uppercase font-body ${inviteStatus === 'PRIORITY SLOT' ? 'text-neon-cyan' : 'text-zinc-500'}`}>
              {inviteStatus === 'QUERYING...' ? <span className="text-yellow-500 animate-pulse">{inviteStatus}</span> : inviteStatus}
            </span>
          </div>
        )}
        <div className={`input-group ${fieldName === 'inviteCode' ? 'relative mb-4' : ''}`}>
          {fieldName === 'inviteCode' && <div className="absolute -left-4 top-0 w-1 h-full bg-neon-pink shadow-[0_0_10px_rgba(240,0,255,0.5)]"></div>}
          {Icon && <Icon />}
          <input 
            type={meta.type} 
            name={fieldName} 
            required={!isHidden && fieldName !== 'inviteCode'} 
            onBlur={fieldName === 'inviteCode' ? handleInviteBlur : undefined}
            value={formData[fieldName] || ''} 
            onChange={handleChange} 
            placeholder={meta.placeholder} 
            className={`input-ghost ${meta.label.includes('Name') ? 'text-lg' : ''}`} 
          />
        </div>
      </div>
    );
  };

  const renderPlayerCard = (num) => {
    const fields = playerGroups[num] || [];
    const isSub = num > tournament.playersPerTeam;
    const isHidden = isSub && !subActive;
    
    let title = "STARTER";
    if (num === 1) title = "CAPTAIN";
    else if (tournament.playersPerTeam === 2 && num === 2) title = "PARTNER";
    if (isSub) title = "SUBSTITUTE";

    const accentDot = num === 1 ? "bg-yellow-400" : (isSub ? "bg-neon-pink" : "bg-white");
    const accentText = num === 1 ? "text-yellow-400" : (isSub ? "text-neon-pink" : "text-white");
    const bgLine = num === 1 ? "bg-yellow-500" : (isSub ? "bg-neon-pink" : "bg-white");

    return (
      <div key={`p${num}`} className={`bg-gradient-to-b from-gray-900/80 to-black border border-white/5 rounded-md relative overflow-hidden transition-all duration-500 hover:border-white/15 hover:-translate-y-1 shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-6 ${isHidden ? 'hidden opacity-0' : 'opacity-100 animate-in slide-in-from-bottom-4 duration-500'}`}>
        <div className={`absolute top-0 left-0 w-full h-[3px] opacity-70 ${bgLine}`}></div>
        <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 font-body">Player {num.toString().padStart(2, '0')}</span>
            <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${accentDot} animate-pulse`}></div>
                <span className={`text-xs font-bold uppercase tracking-widest font-body ${accentText}`}>{title}</span>
            </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {fields.map(f => renderField(f, isHidden))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">
      {/* SECTION 01 - TEAM IDENTITY */}
      <div className="glass-panel p-0 overflow-hidden group/section">
        <div className="flex items-stretch bg-black/50 border-b border-white/10">
          <div className="bg-neon-purple px-5 flex items-center justify-center font-bold font-heading text-3xl text-white italic group-hover/section:bg-neon-pink transition-colors">01</div>
          <h2 className="text-3xl text-white font-heading tracking-wider pl-6 py-4 flex-grow italic uppercase">TEAM IDENTITY</h2>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {teamFields.map(f => renderField(f))}
        </div>
      </div>

      {/* SECTION 02 - TEAM ROSTER */}
      <div className="glass-panel p-0 overflow-hidden group/section">
        <div className="flex items-stretch justify-between bg-black/50 border-b border-white/10 pr-6">
          <div className="flex items-stretch">
              <div className="bg-neon-cyan px-5 flex items-center justify-center font-bold font-heading text-3xl text-black italic group-hover/section:bg-white transition-colors">02</div>
              <h2 className="text-3xl text-white font-heading tracking-wider pl-6 py-4 italic uppercase">TEAM ROSTER</h2>
          </div>
          {hasSubs && (
            <div onClick={() => setSubActive(!subActive)} className="flex items-center gap-3 bg-neon-purple/20 px-5 py-3 rounded border border-neon-purple/50 cursor-pointer group transition-all shadow-[0_0_15px_rgba(138,43,226,0.3)] my-auto hover:bg-neon-purple/40">
                <UsersIcon className="w-5 h-5 text-neon-pink" />
                <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-white font-body">Substitute</span>
                <div className={`relative w-10 h-5 rounded-full border border-white/20 transition-colors duration-300 ml-2 ${subActive ? 'bg-neon-cyan' : 'bg-black'}`}>
                    <div className={`absolute left-0.5 top-0.5 w-3.5 h-3.5 rounded-full transition-transform duration-300 ${subActive ? 'translate-x-[20px] bg-white' : 'bg-zinc-600'}`}></div>
                </div>
            </div>
          )}
        </div>
        <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.keys(playerGroups).sort((a,b) => a-b).map(num => renderPlayerCard(parseInt(num)))}
            </div>
        </div>
      </div>

      {/* SECTION 03 - FINAL VERIFICATION */}
      <div className="glass-panel p-0 overflow-hidden group/section">
        <div className="flex items-stretch bg-black/50 border-b border-white/10">
          <div className="bg-white px-5 flex items-center justify-center font-bold font-heading text-3xl text-black italic group-hover/section:bg-neon-cyan transition-colors">03</div>
          <h2 className="text-3xl text-white font-heading tracking-wider pl-6 py-4 flex-grow italic uppercase">VERIFICATION</h2>
        </div>
        <div className="p-8">
            <div className="mb-6"><span className="text-sm text-neon-pink uppercase tracking-widest font-bold font-body">Required Protocols:</span></div>
            <div className="space-y-4 mb-10 font-body">
                {["MANDATORY ANTI-CHEAT", "COMMUNICATION", "SCHEDULE"].map((prot, idx) => (
                  <label key={prot} className="flex items-center gap-4 p-5 bg-black/50 border border-white/5 cursor-pointer hover:border-neon-cyan transition-colors group rounded shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                      <input type="checkbox" required className="w-5 h-5 accent-neon-cyan rounded-sm flex-shrink-0 cursor-pointer" />
                      <span className="text-sm text-zinc-400 group-hover:text-white transition-colors leading-relaxed">
                          <strong className="text-white">{prot}</strong> — {idx === 0 ? `Our ${tournament.playersPerTeam === 2 ? 'duo' : 'team'} confirms Akros Anti-Cheat installation for all players.` : idx === 1 ? `All players have joined the Pixel Palace Discord server.` : `Confirming availability for the registration deadline and tournament dates.`}
                      </span>
                  </label>
                ))}
            </div>
            {error && (
              <div className="mb-8 border border-red-500 bg-red-950/80 p-4 text-red-400 text-sm font-bold uppercase tracking-widest text-center shadow-[0_0_20px_rgba(239,68,68,0.3)] font-body flex items-center justify-center gap-3 animate-shake">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span>{error}</span>
              </div>
            )}
            <button type="submit" disabled={isSubmitting} className="btn-ignite w-full flex justify-center items-center h-[72px]">
                {isSubmitting ? (
                  <span className="flex items-center gap-3"><Loader2 className="w-6 h-6 animate-spin" /> TRANSMITTING...</span>
                ) : (
                  <span>SUBMIT REGISTRATION</span>
                )}
            </button>
        </div>
      </div>
    </form>
  );
};
