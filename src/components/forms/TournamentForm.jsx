/**
 * TournamentForm.jsx
 *
 * DEPENDENCIES REQUIRED (run once):
 *   npm install react-hook-form @hookform/resolvers
 *
 * Architecture:
 *  - useForm + zodResolver → zero uncontrolled re-renders; validation runs on
 *    submit and per-field on touch. No useState for form values.
 *  - useFieldArray → `players` array is the source of truth for roster cards.
 *    Sub toggle simply appends/removes a player — no separate subActive state.
 *  - Controller → used only for the range slider (non-standard input).
 *  - Invite code onBlur → side-effect lookup, NOT a Zod validator.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFormSubmit } from '../../hooks/useFormSubmit';
import { validateInviteCode } from '../../services/sheets';
import { resolveSteam64 } from '../../services/steam';
import { fetchFaceitProfile } from '../../services/faceit';
import { LogoUploader } from './LogoUploader';
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Users as UsersIcon,
  MessageSquare,
  Gamepad2,
  Crosshair,
  Award,
  Key,
  Users,
  Tag,
  Globe,
  Image as ImageIcon,
  Zap,
} from 'lucide-react';

// ─── Dynamic Zod Schema ────────────────────────────────────────────────────────
// Built per-tournament so coreCount is encoded into the min() guard.
// All players in the form array are required — when a sub is added, they fill it.
// When a sub is removed via the toggle, the element is gone from the array.
const buildFormSchema = (tournament) => {
  const coreCount = tournament.playersPerTeam ?? 5;

  const playerSchema = z.object({
    ign: z.string().min(1, 'In-Game Name required'),
    discord: z.string().min(1, 'Discord handle required').transform(v => v.trim().toLowerCase()),
    steam: z.string().min(1, 'Steam URL required'),
    steam64: z.string().optional(),
    faceit: z.string().min(1, 'FACEIT URL required'),
    faceitLevel: z.string().default('N/A'),
    faceitElo: z.string().default('N/A'),
    cs2RankLabel: z.string().default('Not Linked'),
  });

  return z.object({
    inviteCode: z.string().optional().default(''),
    teamName: z.string().min(1, 'Team name is required'),
    teamTag: z
      .string()
      .min(1, 'Team tag is required')
      .regex(/^[A-Za-z0-9]+$/, 'Alphanumeric characters only'),
    teamRegion: z.string().min(1, 'Select a region'),
    logoLink: z.string().min(1, 'Logo URL is required'),
    players: z
      .array(playerSchema)
      .min(coreCount, `Minimum ${coreCount} players required`),
  });
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const blankPlayer = () => ({ ign: '', discord: '', steam: '', steam64: '', faceit: '', faceitLevel: '', faceitElo: '', cs2RankLabel: '' });

const getPlayerMeta = (index, coreCount) => {
  if (index === 0)
    return {
      title: 'CAPTAIN',
      dotClass: 'bg-yellow-400',
      textClass: 'text-yellow-400',
      lineClass: 'bg-yellow-500',
    };
  if (index >= coreCount)
    return {
      title: 'SUBSTITUTE',
      dotClass: 'bg-neon-pink',
      textClass: 'text-neon-pink',
      lineClass: 'bg-neon-pink',
    };
  if (coreCount === 2)
    return {
      title: 'PARTNER',
      dotClass: 'bg-white',
      textClass: 'text-white',
      lineClass: 'bg-white',
    };
  return {
    title: 'STARTER',
    dotClass: 'bg-white',
    textClass: 'text-white',
    lineClass: 'bg-white',
  };
};

// ─── Component ────────────────────────────────────────────────────────────────
export const TournamentForm = ({ tournament }) => {
  const [inviteStatus, setInviteStatus] = useState('AWAITING INPUT...');
  const corePlayerCount = tournament.playersPerTeam ?? 5;
  const hasSubs = (tournament.substitutes?.max ?? 0) > 0;

  // Memoize schema so it only rebuilds when tournament changes
  const formSchema = useMemo(() => buildFormSchema(tournament), [tournament]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inviteCode: '',
      teamName: '',
      teamTag: '',
      teamRegion: '',
      logoLink: '',
      players: Array.from({ length: corePlayerCount }, blankPlayer),
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'players' });

  // `subActive` is DERIVED — not separate state. Clean.
  const subActive = fields.length > corePlayerCount;

  const { submit, isSubmitting, error, isSuccess } = useFormSubmit(tournament.id);

  // ── Sub toggle ──────────────────────────────────────────────────────────────
  const handleSubToggle = () => {
    if (subActive) {
      remove(fields.length - 1);
    } else {
      append(blankPlayer());
    }
  };

  // ── Invite code live validation (side-effect, not Zod) ─────────────────────
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

  // ── Auto-Resolving UI Status Caches ──────────────────────────────────────────
  const [steamStatus, setSteamStatus] = useState({});
  const [faceitStatus, setFaceitStatus] = useState({});

  const handleSteamBlur = async (index, value) => {
    if (!value) return;
    setSteamStatus((prev) => ({ ...prev, [index]: 'RESOLVING...' }));
    try {
      const steam64 = await resolveSteam64(value, tournament.steamApiKey);
      setValue(`players.${index}.steam64`, steam64);
      setSteamStatus((prev) => ({ ...prev, [index]: 'SUCCESS' }));
    } catch (err) {
      setSteamStatus((prev) => ({ ...prev, [index]: 'FAILED' }));
    }
  };

  const handleFaceitBlur = async (index, value) => {
    if (!value) return;
    setFaceitStatus((prev) => ({ ...prev, [index]: 'FETCHING...' }));
    try {
      const data = await fetchFaceitProfile(value, tournament.faceitApiKey);
      if (data) {
        setValue(`players.${index}.faceitLevel`, data.faceitLevel?.toString());
        setValue(`players.${index}.faceitElo`, data.faceitElo?.toString());
        setValue(`players.${index}.cs2RankLabel`, data.cs2RankLabel?.toString());
        
        // Auto-populate Steam if blank and Faceit provided it
        if (data.steam64 && !getValues(`players.${index}.steam64`)) {
           setValue(`players.${index}.steam64`, data.steam64);
           // Not overwriting the visible URL input so it won't be weird, just the hidden field
        }
        setFaceitStatus((prev) => ({ ...prev, [index]: 'SUCCESS' }));
      } else {
        setFaceitStatus((prev) => ({ ...prev, [index]: 'FAILED' }));
      }
    } catch (err) {
      setFaceitStatus((prev) => ({ ...prev, [index]: 'FAILED' }));
    }
  };

  // ── Mock Pre-Fill Injection (Admin Testing) ──────────────────────────────────
  useEffect(() => {
    const handleMockFill = () => {
      setValue('teamName', 'PIXEL TEST SQUAD', { shouldValidate: true });
      setValue('teamTag', 'TEST', { shouldValidate: true });
      setValue('teamRegion', 'EU', { shouldValidate: true });
      setValue('logoLink', 'https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_dust2.png', { shouldValidate: true });
      
      const mockProfiles = [
        { ign: "s1mple", steam: "https://steamcommunity.com/id/s1mpleO", faceit: "https://www.faceit.com/en/players/s1mple", discord: "s1mple_test" },
        { ign: "ZywOo", steam: "https://steamcommunity.com/id/ZywOo_test", faceit: "https://www.faceit.com/en/players/ZywOo", discord: "zywoo_test" },
        { ign: "NiKo", steam: "https://steamcommunity.com/profiles/76561197990449419", faceit: "https://www.faceit.com/en/players/NiKo", discord: "niko_test" },
        { ign: "m0NESY", steam: "https://steamcommunity.com/profiles/76561198428588049", faceit: "https://www.faceit.com/en/players/m0NESY", discord: "m0nesy_test" },
        { ign: "donk", steam: "https://steamcommunity.com/id/donk_test", faceit: "https://www.faceit.com/en/players/donk", discord: "donk_test" }
      ];

      fields.forEach((_, idx) => {
        const mock = mockProfiles[idx] || mockProfiles[0];
        setValue(`players.${idx}.ign`, mock.ign, { shouldValidate: true });
        setValue(`players.${idx}.discord`, mock.discord, { shouldValidate: true });
        setValue(`players.${idx}.steam`, mock.steam, { shouldValidate: true });
        setValue(`players.${idx}.faceit`, mock.faceit, { shouldValidate: true });
        
        handleSteamBlur(idx, mock.steam);
        handleFaceitBlur(idx, mock.faceit);
      });
    };

    window.addEventListener('admin-mock-fill', handleMockFill);
    return () => window.removeEventListener('admin-mock-fill', handleMockFill);
  }); // Omitted dependency array because it captures local hook closures without tearing them down

  // ── Submit (react-hook-form calls this only when schema passes) ─────────────
  const onSubmit = async (formData) => {
    await submit(formData);
    // sessionStorage idempotency key is cleaned up inside useFormSubmit on success
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

  // ─── SECTION 01 — TEAM IDENTITY ──────────────────────────────────────────
  const TeamIdentity = (
    <div className="glass-panel p-0 overflow-hidden group/section">
      <div className="flex items-stretch bg-black/50 border-b border-white/10">
        <div className="bg-neon-purple px-5 flex items-center justify-center font-bold font-heading text-3xl text-white italic group-hover/section:bg-neon-pink transition-colors">
          01
        </div>
        <h2 className="text-3xl text-white font-heading tracking-wider pl-6 py-4 flex-grow italic uppercase">
          Team Identity
        </h2>
      </div>

      <div className="p-8 space-y-6">
        {/* Invite Code */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-neon-pink font-body">
              Invite Code (Optional — unlocks priority slot)
            </label>
            <span
              className={`text-[10px] font-bold uppercase font-body transition-colors ${
                inviteStatus === 'PRIORITY SLOT'
                  ? 'text-neon-cyan'
                  : inviteStatus === 'QUERYING...'
                  ? 'text-yellow-400 animate-pulse'
                  : 'text-zinc-500'
              }`}
            >
              {inviteStatus}
            </span>
          </div>
          <div className="input-group relative">
            <div className="absolute -left-4 top-0 w-1 h-full bg-neon-pink shadow-[0_0_10px_rgba(240,0,255,0.5)]" />
            <Key className="ml-3 w-4 h-4 text-white/30" />
            <input
              {...register('inviteCode')}
              onBlur={handleInviteBlur}
              type="text"
              placeholder="Leave blank if none"
              className="input-ghost"
            />
          </div>
        </div>

        {/* Team Name */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 block font-body">
            Team Name <span className="text-red-500">*</span>
          </label>
          <div className="input-group">
            <Users className="ml-3 w-4 h-4 text-white/30" />
            <input
              {...register('teamName')}
              type="text"
              placeholder="e.g. Natus Vincere"
              className="input-ghost text-lg"
            />
          </div>
          {errors.teamName && (
            <p className="text-red-400 text-[10px] mt-1 font-body uppercase tracking-widest">
              {errors.teamName.message}
            </p>
          )}
        </div>

        {/* Team Tag + Region */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 block font-body">
              Team Tag <span className="text-red-500">*</span>
            </label>
            <div className="input-group">
              <Tag className="ml-3 w-4 h-4 text-white/30" />
              <input
                {...register('teamTag')}
                type="text"
                placeholder="e.g. CHAO"
                maxLength={8}
                className="input-ghost"
              />
            </div>
            {errors.teamTag && (
              <p className="text-red-400 text-[10px] mt-1 font-body uppercase tracking-widest">
                {errors.teamTag.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 block font-body">
              Server Region <span className="text-red-500">*</span>
            </label>
            <div className="input-group">
              <Globe className="ml-3 w-4 h-4 text-white/30" />
              <select
                {...register('teamRegion')}
                className="input-ghost appearance-none cursor-pointer"
              >
                <option value="" disabled>
                  Select Region...
                </option>
                <option value="IND" className="bg-black">
                  India (IND)
                </option>
                <option value="PAK" className="bg-black">
                  Pakistan (PAK)
                </option>
                <option value="ME" className="bg-black">
                  Middle East (ME)
                </option>
              </select>
            </div>
            {errors.teamRegion && (
              <p className="text-red-400 text-[10px] mt-1 font-body uppercase tracking-widest">
                {errors.teamRegion.message}
              </p>
            )}
          </div>
        </div>

        {/* Logo Upload Component */}
        <LogoUploader
          tournament={tournament}
          formRegister={register}
          errorMessage={errors.logoLink?.message}
          onUploadSuccess={(url) => setValue('logoLink', url, { shouldValidate: true })}
          onUploadRemove={() => setValue('logoLink', '', { shouldValidate: true })}
        />
      </div>
    </div>
  );

  // ─── SECTION 02 — TEAM ROSTER ─────────────────────────────────────────────
  const TeamRoster = (
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

        {hasSubs && (
          <button
            type="button"
            onClick={handleSubToggle}
            className="flex items-center gap-3 bg-neon-purple/20 px-5 py-3 rounded border border-neon-purple/50 cursor-pointer transition-all shadow-[0_0_15px_rgba(138,43,226,0.3)] my-auto hover:bg-neon-purple/40 select-none"
          >
            <UsersIcon className="w-5 h-5 text-neon-pink" />
            <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-white font-body">
              {subActive ? '1 Sub' : '0 Subs'}
            </span>
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
          </button>
        )}
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((field, index) => {
            const meta = getPlayerMeta(index, corePlayerCount);

            return (
              <div
                key={field.id}
                className="bg-gradient-to-b from-gray-900/80 to-black border border-white/5 rounded-md relative overflow-hidden transition-all duration-500 hover:border-white/15 hover:-translate-y-1 shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-6"
              >
                {/* Accent line */}
                <div className={`absolute top-0 left-0 w-full h-[3px] opacity-70 ${meta.lineClass}`} />

                {/* Card header */}
                <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-3">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 font-body">
                    Player {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${meta.dotClass} animate-pulse`} />
                    <span className={`text-xs font-bold uppercase tracking-widest font-body ${meta.textClass}`}>
                      {meta.title}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* IGN + Discord */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block font-body">
                        In-Game Name (IGN) <span className="text-red-500">*</span>
                      </label>
                      <div className="input-group">
                        <Zap className="ml-3 w-4 h-4 text-white/30" />
                        <input
                          {...register(`players.${index}.ign`)}
                          type="text"
                          placeholder="What you're called in-game"
                          className="input-ghost text-xs"
                        />
                      </div>
                      {errors.players?.[index]?.ign && (
                        <p className="text-red-400 text-[10px] mt-1 font-body">{errors.players[index].ign.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block font-body">
                        Discord Username <span className="text-red-500">*</span>
                      </label>
                      <div className="input-group">
                        <MessageSquare className="ml-3 w-4 h-4 text-white/30" />
                        <input
                          {...register(`players.${index}.discord`)}
                          type="text"
                          placeholder="username (no #0000)"
                          className="input-ghost text-xs"
                        />
                      </div>
                      <p className="text-zinc-500 text-[9px] mt-1 font-body">Exact username, no display names.</p>
                      {errors.players?.[index]?.discord && (
                        <p className="text-red-400 text-[10px] mt-1 font-body">{errors.players[index].discord.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Steam URL */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block font-body">
                      Steam Profile URL <span className="text-red-500">*</span>
                    </label>
                    <div className="input-group">
                      <Gamepad2 className="ml-3 w-4 h-4 text-white/30" />
                      <input
                        {...register(`players.${index}.steam`)}
                        type="url"
                        placeholder="https://steamcommunity.com/id/yourname"
                        className="input-ghost text-xs"
                        onBlur={(e) => handleSteamBlur(index, e.target.value)}
                      />
                    </div>
                    {/* Resolution Status Display */}
                    <div className="mt-1 min-h-[16px] flex items-center">
                    {steamStatus[index] === 'RESOLVING...' && <span className="text-zinc-400 text-[9px] font-bold font-body tracking-wider">RESOLVING ID...</span>}
                    {steamStatus[index] === 'SUCCESS' && <span className="text-neon-cyan text-[9px] font-bold font-body tracking-wider">STEAM ID VERIFIED ✓ ({getValues(`players.${index}.steam64`)})</span>}
                    {steamStatus[index] === 'FAILED' && <span className="text-red-500 text-[9px] font-bold font-body tracking-wider">RESOLUTION FAILED — Enter ID manually below</span>}
                    </div>
                    
                    {steamStatus[index] === 'FAILED' && (
                        <input
                           {...register(`players.${index}.steam64`)}
                           type="text"
                           placeholder="Steam64 ID (17 digits)"
                           className="input-ghost mt-1 border border-red-500/30 font-mono text-xs text-red-100"
                        />
                    )}
                  </div>

                  {/* FACEIT URL */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block font-body">
                      FACEIT Profile URL <span className="text-red-500">*</span>
                    </label>
                    <div className="input-group">
                      <Crosshair className="ml-3 w-4 h-4 text-white/30" />
                      <input
                        {...register(`players.${index}.faceit`)}
                        type="url"
                        placeholder="https://www.faceit.com/en/players/yourname"
                        className="input-ghost text-xs"
                        onBlur={(e) => handleFaceitBlur(index, e.target.value)}
                      />
                    </div>
                  </div>

                  {/* FACEIT & CS2 Stat Badges */}
                  <Controller
                    control={control}
                    name={`players.${index}.faceitLevel`}
                    render={({ field: lvlField }) => {
                       const elo = getValues(`players.${index}.faceitElo`);
                       const rank = getValues(`players.${index}.cs2RankLabel`);
                       const state = faceitStatus[index];
                       const lvl = lvlField.value;

                       let badgeColor = 'bg-zinc-800 text-zinc-400 border-zinc-700'; // DEFAULT
                       if (state === 'FETCHING...') badgeColor = 'bg-cyan-900/30 text-neon-cyan border-neon-cyan animate-pulse';
                       else if (state === 'FAILED') badgeColor = 'bg-yellow-900/30 text-yellow-400 border-yellow-500';
                       else if (state === 'SUCCESS') {
                          const l = parseInt(lvl);
                          if (l <= 3) badgeColor = 'bg-zinc-800 text-white border-zinc-500';
                          else if (l <= 6) badgeColor = 'bg-green-900/30 text-green-400 border-green-500';
                          else if (l <= 8) badgeColor = 'bg-yellow-900/30 text-yellow-500 border-yellow-500';
                          else badgeColor = 'bg-red-900/30 text-red-500 border-red-500';
                       }

                       return (
                         <div className="bg-black/40 border-t-2 border-white/10 rounded-t p-3 flex gap-2 sm:gap-4 mt-2">
                           <div className="flex flex-col flex-1">
                              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1 font-body">FACEIT LVL</span>
                              <div className={`px-2 py-1.5 flex items-center justify-center font-bold text-xs rounded border ${badgeColor}`}>
                                 {state === 'FETCHING...' ? 'FETCHING' : (state === 'FAILED' ? 'MANUAL INPUT' : (lvl || 'AWAITING URL'))}
                              </div>
                              {state === 'FAILED' && (
                                <select {...lvlField} className="mt-2 bg-black border border-yellow-500 text-yellow-400 text-xs px-2 py-1 outline-none w-full cursor-pointer focus:ring-0">
                                   <option value="N/A">Select Lvl</option>
                                   {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                              )}
                           </div>
                           <div className="flex flex-col flex-1">
                              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1 font-body">ELO</span>
                              <div className="flex-1 min-h-[30px] bg-black/50 border border-white/5 rounded flex items-center justify-center text-xs font-bold text-white tracking-wider">
                                 {state === 'FETCHING...' ? '...' : (elo || 'N/A')}
                              </div>
                           </div>
                           <div className="flex flex-col flex-1">
                              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1 font-body">CS2 RANK</span>
                              <div className="flex-1 min-h-[30px] bg-black/50 border border-white/5 rounded flex items-center justify-center text-xs font-bold text-white tracking-wider text-center px-1">
                                 {state === 'FETCHING...' ? '...' : (rank || 'Not Linked')}
                              </div>
                           </div>
                         </div>
                       )
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ─── SECTION 03 — FINAL VERIFICATION ─────────────────────────────────────
  const duoOrTeam = corePlayerCount === 2 ? 'duo' : 'team';
  const totalActivePlayers = fields.length;

  const verificationItems = tournament.customVerification
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
          body: `Our ${duoOrTeam} acknowledges that ${tournament.antiCheat ?? 'Akros'} Anti-Cheat must be installed by all ${totalActivePlayers} players.`,
        },
        {
          key: 'discord',
          label: 'COMMUNICATION',
          body: `All ${totalActivePlayers} players have joined the Pixel Palace Discord server.`,
        },
        {
          key: 'schedule',
          label: 'SCHEDULE',
          body: `We confirm availability for the registration deadline and all tournament dates.`,
        },
      ];

  const FinalVerification = (
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
        <div className="space-y-4 mb-10">
          {verificationItems.map((item) => (
            <label
              key={item.key}
              className="flex items-start gap-4 p-5 bg-black/50 border border-white/5 cursor-pointer hover:border-neon-cyan transition-colors group rounded shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
            >
              <input
                type="checkbox"
                required
                className="w-5 h-5 flex-shrink-0 accent-neon-cyan rounded-sm cursor-pointer mt-0.5"
              />
              <span className="text-sm text-zinc-400 group-hover:text-white transition-colors leading-relaxed font-body">
                <strong className="text-white uppercase tracking-wider">{item.label}</strong>
                {item.body && <>{' '}—{' '}{item.body}</>}
              </span>
            </label>
          ))}
        </div>

        {/* Error box — shows gateway errors after zod validation passes */}
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
  );

  // ─── FORM ROOT ────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8 pb-20">
      {TeamIdentity}
      {TeamRoster}
      {FinalVerification}
    </form>
  );
};
