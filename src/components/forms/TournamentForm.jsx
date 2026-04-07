import React, { useState, useEffect, useMemo } from 'react';
import { useFormSubmit } from '../../hooks/useFormSubmit';
import { validateInviteCode } from '../../services/sheets';
import { getFieldMeta } from '../../utils/formFields';
import { Loader2, CheckCircle2, AlertTriangle, Users as UsersIcon } from 'lucide-react';

export const TournamentForm = ({ tournament }) => {
  const { submit, isSubmitting, error, isSuccess } = useFormSubmit(tournament.id);
  const [formData, setFormData] = useState({});
  const [subActive, setSubActive] = useState(false);
  const [inviteStatus, setInviteStatus] = useState('AWAITING INPUT...');

  const hasSubs = tournament.substitutes && tournament.substitutes.max > 0;
  // playersPerTeam drives required player count; sub is the card beyond that
  const corePlayerCount = tournament.playersPerTeam || 5;

  // Parse fields into groups
  const { teamFields, playerGroups } = useMemo(() => {
    const team = [];
    const players = {}; // { 1: [], 2: [], ... }

    tournament.fields.forEach(field => {
      const meta = getFieldMeta(field);
      if (meta.playerNum) {
        const num = parseInt(meta.playerNum);
        if (!players[num]) players[num] = [];
        players[num].push(field);
      } else {
        team.push(field);
      }
    });

    return { teamFields: team, playerGroups: players };
  }, [tournament]);

  useEffect(() => {
    const initialData = {};
    tournament.fields.forEach(field => {
      if (field.endsWith('Rank')) initialData[field] = '5';
    });
    setFormData(prev => ({ ...initialData, ...prev }));
  }, [tournament]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleInviteBlur = async (e) => {
    const code = e.target.value.trim();
    if (!code) {
      setInviteStatus('AWAITING INPUT...');
      return;
    }
    setInviteStatus('QUERYING...');
    try {
      const res = await validateInviteCode(tournament.id, code);
      setInviteStatus(res.valid ? 'PRIORITY SLOT' : 'OPEN SLOT');
    } catch {
      setInviteStatus('AWAITING INPUT...');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let idempotencyKey = sessionStorage.getItem('pp_idemp_key');
    if (!idempotencyKey) {
      idempotencyKey = crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2);
      sessionStorage.setItem('pp_idemp_key', idempotencyKey);
    }

    const payload = {
      idempotencyKey,
      subCount: subActive ? 1 : 0,
      ...formData,
    };

    const result = await submit(payload);
    if (result.success) {
      sessionStorage.removeItem('pp_idemp_key');
    }
  };

  // ─── SUCCESS STATE ────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="glass-panel p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-neon-cyan blur-[40px] opacity-30 rounded-full" />
          <CheckCircle2 className="w-28 h-28 text-neon-cyan relative z-10 drop-shadow-[0_0_30px_rgba(0,240,255,0.6)]" />
        </div>
        <h2 className="text-7xl font-black text-white mb-4 font-heading drop-shadow-[0_0_20px_rgba(0,240,255,0.4)] uppercase tracking-widest">
          ROSTER SECURED
        </h2>
        <p className="text-zinc-400 text-xl font-body uppercase tracking-widest">
          Registration confirmed. Check the Live Roster Tracker.
        </p>
      </div>
    );
  }

  // ─── FIELD RENDERERS ─────────────────────────────────────────────────────

  /** Render a standard team-level field */
  const renderTeamField = (fieldName) => {
    const meta = getFieldMeta(fieldName);
    const Icon = meta.icon;

    // Wide fields: full width
    const isFullWidth =
      fieldName === 'inviteCode' ||
      fieldName === 'teamName' ||
      fieldName === 'logoLink';

    if (meta.type === 'select') {
      return (
        <div key={fieldName} className="col-span-1">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 block font-body">
            {meta.label}
          </label>
          <div className="input-group">
            {Icon && <Icon />}
            <select
              name={fieldName}
              required
              value={formData[fieldName] || ''}
              onChange={handleChange}
              className="input-ghost appearance-none cursor-pointer"
            >
              <option value="" disabled>{meta.placeholder}</option>
              {meta.options.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-black">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    }

    // Invite code — special treatment
    if (fieldName === 'inviteCode') {
      return (
        <div key={fieldName} className="col-span-full">
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-neon-pink font-body">
              Invite Code (Optional — unlocks priority slot)
            </label>
            <span
              className={`text-[10px] font-bold uppercase font-body transition-colors ${
                inviteStatus === 'PRIORITY SLOT'
                  ? 'text-neon-cyan'
                  : inviteStatus === 'QUERYING...'
                  ? 'text-yellow-400'
                  : 'text-zinc-500'
              } ${inviteStatus === 'QUERYING...' ? 'animate-pulse' : ''}`}
            >
              {inviteStatus}
            </span>
          </div>
          <div className="input-group relative">
            <div className="absolute -left-4 top-0 w-1 h-full bg-neon-pink shadow-[0_0_10px_rgba(240,0,255,0.5)]" />
            {Icon && <Icon />}
            <input
              type="text"
              name={fieldName}
              required={false}
              onBlur={handleInviteBlur}
              value={formData[fieldName] || ''}
              onChange={handleChange}
              placeholder={meta.placeholder}
              className="input-ghost"
            />
          </div>
        </div>
      );
    }

    return (
      <div key={fieldName} className={isFullWidth ? 'col-span-full' : 'col-span-1'}>
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 block font-body">
          {meta.label}
        </label>
        <div className="input-group">
          {Icon && <Icon />}
          <input
            type={meta.type}
            name={fieldName}
            required
            value={formData[fieldName] || ''}
            onChange={handleChange}
            placeholder={meta.placeholder}
            pattern={meta.pattern}
            className={`input-ghost ${fieldName === 'teamName' ? 'text-lg' : ''}`}
          />
        </div>
      </div>
    );
  };

  /** Render a player-level field inside a player card */
  const renderPlayerField = (fieldName, isRequired) => {
    const meta = getFieldMeta(fieldName);
    const Icon = meta.icon;

    if (meta.type === 'range') {
      return (
        <div
          key={fieldName}
          className="bg-black/40 border-b-2 border-white/10 rounded-t p-2 px-3 hover:bg-neon-cyan/5 hover:border-neon-cyan transition-colors col-span-full"
        >
          <div className="flex justify-between items-center w-full mb-2">
            <div className="flex items-center gap-2 text-zinc-400">
              {Icon && <Icon className="w-4 h-4" />}
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] font-body">{meta.label}</span>
            </div>
            <span className="text-xl font-heading text-neon-cyan drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
              {formData[fieldName] || '5'}
            </span>
          </div>
          <input
            type="range"
            name={fieldName}
            min={meta.min}
            max={meta.max}
            value={formData[fieldName] || '5'}
            onChange={handleChange}
            className="cyber-slider"
          />
        </div>
      );
    }

    // colSpan drives layout: "full" → col-span-full, "half" → col-span-1
    const colClass = meta.colSpan === 'full' ? 'col-span-full' : 'col-span-1';

    return (
      <div key={fieldName} className={colClass}>
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 block font-body">
          {meta.label}
        </label>
        <div className="input-group">
          {Icon && <Icon />}
          <input
            type={meta.type}
            name={fieldName}
            required={isRequired}
            value={formData[fieldName] || ''}
            onChange={handleChange}
            placeholder={meta.placeholder}
            className="input-ghost"
          />
        </div>
      </div>
    );
  };

  // ─── PLAYER CARD ─────────────────────────────────────────────────────────
  const renderPlayerCard = (num) => {
    const fields = playerGroups[num] || [];
    const isSub = num > corePlayerCount;
    const isHidden = isSub && !subActive;
    const isRequired = !isSub; // sub fields are optional

    let title = 'STARTER';
    if (num === 1) title = 'CAPTAIN';
    else if (corePlayerCount === 2 && num === 2) title = 'PARTNER';
    else if (corePlayerCount === 2 && num > 2) title = 'SUBSTITUTE';
    else if (isSub) title = 'SUBSTITUTE';

    const accentDot = num === 1 ? 'bg-yellow-400' : isSub ? 'bg-neon-pink' : 'bg-white';
    const accentText = num === 1 ? 'text-yellow-400' : isSub ? 'text-neon-pink' : 'text-white';
    const bgLine = num === 1 ? 'bg-yellow-500' : isSub ? 'bg-neon-pink' : 'bg-white';

    return (
      <div
        key={`p${num}`}
        className={`bg-gradient-to-b from-gray-900/80 to-black border border-white/5 rounded-md relative overflow-hidden transition-all duration-500 hover:border-white/15 hover:-translate-y-1 shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-6 ${
          isHidden ? 'hidden' : ''
        }`}
      >
        <div className={`absolute top-0 left-0 w-full h-[3px] opacity-70 ${bgLine}`} />

        {/* Card header */}
        <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-3">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 font-body">
            Player {String(num).padStart(2, '0')}
          </span>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${accentDot} animate-pulse`} />
            <span className={`text-xs font-bold uppercase tracking-widest font-body ${accentText}`}>
              {title}
            </span>
          </div>
        </div>

        {/* Fields — 2-col grid so Discord is full-width, Steam+FACEIT are side-by-side, Rank spans full */}
        <div className="grid grid-cols-2 gap-3">
          {fields.map(f => renderPlayerField(f, isRequired))}
        </div>
      </div>
    );
  };

  // ─── Verification checkbox text ───────────────────────────────────────────
  const activePlayerCount = corePlayerCount + (subActive ? 1 : 0);
  const duoOrTeam = corePlayerCount === 2 ? 'duo' : 'team';

  const verificationItems = [
    {
      key: 'anticheat',
      label: 'MANDATORY ANTI-CHEAT',
      body: `Our ${duoOrTeam} acknowledges that ${tournament.antiCheat} Anti-Cheat must be installed by all ${activePlayerCount} players.`,
    },
    {
      key: 'communication',
      label: 'COMMUNICATION',
      body: `All ${activePlayerCount} players have joined the Pixel Palace Discord server.`,
    },
    {
      key: 'schedule',
      label: 'SCHEDULE',
      body: `We confirm availability for the registration deadline and tournament dates.`,
    },
  ];

  // ─── FORM RENDER ─────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">

      {/* SECTION 01 — TEAM IDENTITY */}
      <div className="glass-panel p-0 overflow-hidden group/section">
        <div className="flex items-stretch bg-black/50 border-b border-white/10">
          <div className="bg-neon-purple px-5 flex items-center justify-center font-bold font-heading text-3xl text-white italic group-hover/section:bg-neon-pink transition-colors">
            01
          </div>
          <h2 className="text-3xl text-white font-heading tracking-wider pl-6 py-4 flex-grow italic uppercase">
            Team Identity
          </h2>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {teamFields.map(f => renderTeamField(f))}
        </div>
      </div>

      {/* SECTION 02 — TEAM ROSTER */}
      <div className="glass-panel p-0 overflow-hidden group/section">
        <div className="flex items-stretch justify-between bg-black/50 border-b border-white/10 pr-6">
          <div className="flex items-stretch">
            <div className="bg-neon-cyan px-5 flex items-center justify-center font-bold font-heading text-3xl text-black italic group-hover/section:bg-white transition-colors">
              02
            </div>
            <h2 className="text-3xl text-white font-heading tracking-wider pl-6 py-4 italic uppercase">
              Team Roster
            </h2>
          </div>

          {/* Sub toggle */}
          {hasSubs && (
            <div
              onClick={() => setSubActive(v => !v)}
              className="flex items-center gap-3 bg-neon-purple/20 px-5 py-3 rounded border border-neon-purple/50 cursor-pointer transition-all shadow-[0_0_15px_rgba(138,43,226,0.3)] my-auto hover:bg-neon-purple/40 select-none"
            >
              <UsersIcon className="w-5 h-5 text-neon-pink" />
              <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-white font-body">
                {subActive ? '1 Sub' : '0 Subs'}
              </span>
              {/* Toggle pill */}
              <div
                className={`relative w-10 h-5 rounded-full border border-white/20 transition-colors duration-300 ml-2 ${
                  subActive ? 'bg-neon-cyan' : 'bg-black'
                }`}
              >
                <div
                  className={`absolute left-0.5 top-0.5 w-3.5 h-3.5 rounded-full transition-transform duration-300 ${
                    subActive ? 'translate-x-[20px] bg-white' : 'bg-zinc-600'
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.keys(playerGroups)
              .sort((a, b) => a - b)
              .map(num => renderPlayerCard(parseInt(num)))}
          </div>
        </div>
      </div>

      {/* SECTION 03 — FINAL VERIFICATION */}
      <div className="glass-panel p-0 overflow-hidden group/section">
        <div className="flex items-stretch bg-black/50 border-b border-white/10">
          <div className="bg-white px-5 flex items-center justify-center font-bold font-heading text-3xl text-black italic group-hover/section:bg-neon-cyan transition-colors">
            03
          </div>
          <div className="pl-6 py-4 flex flex-col justify-center">
            <h2 className="text-3xl text-white font-heading tracking-wider italic uppercase leading-none">
              Final Verification
            </h2>
            <span className="text-xs text-neon-pink font-body font-bold uppercase tracking-[0.2em] mt-1">
              We confirm that:
            </span>
          </div>
        </div>

        <div className="p-8">
          <div className="space-y-4 mb-10 font-body">
            {verificationItems.map(item => (
              <label
                key={item.key}
                className="flex items-start gap-4 p-5 bg-black/50 border border-white/5 cursor-pointer hover:border-neon-cyan transition-colors group rounded shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
              >
                <input
                  type="checkbox"
                  required
                  className="w-5 h-5 flex-shrink-0 accent-neon-cyan rounded-sm cursor-pointer mt-0.5"
                />
                <span className="text-sm text-zinc-400 group-hover:text-white transition-colors leading-relaxed">
                  <strong className="text-white uppercase tracking-wider">{item.label}</strong>
                  {' '}—{' '}
                  {item.body}
                </span>
              </label>
            ))}
          </div>

          {/* Error box */}
          {error && (
            <div className="mb-8 border border-red-500 bg-red-950/80 p-4 text-red-400 text-sm font-bold uppercase tracking-widest text-center shadow-[0_0_20px_rgba(239,68,68,0.3)] font-body flex items-center justify-center gap-3 animate-shake">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span>{error} — Please retry.</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-ignite w-full flex justify-center items-center h-[72px]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin" />
                TRANSMITTING...
              </span>
            ) : (
              <span>SUBMIT REGISTRATION</span>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
