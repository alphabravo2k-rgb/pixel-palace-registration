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
  Copy,
  Check,
  ExternalLink,
  Activity,
  ShieldAlert,
  AlertOctagon,
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
    avatar: z.string().optional().default(''),
    walletAddress: z.string().optional().default(''),
  });

  return z.object({
    inviteCode: z.string().optional().default(''),
    teamName: z.string()
      .min(2, 'Team name must be at least 2 characters')
      .max(64, 'Team name max 64 chars')
      .regex(/^[\w\s\-'.!]+$/u, 'No restricted special characters'),
    teamTag: z
      .string()
      .min(1, 'Team tag is required')
      .max(8, 'Tag max 8 chars')
      .regex(/^[A-Za-z0-9]+$/, 'Alphanumeric letters only'),
    teamRegion: z.string().min(1, 'Select a region'),
    logoLink: z.string().min(1, 'Logo URL is required'),
    players: z
      .array(playerSchema)
      .min(coreCount, `Minimum ${coreCount} players required`),
  });
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const blankPlayer = () => ({ ign: '', discord: '', steam: '', steam64: '', faceit: '', faceitLevel: '', faceitElo: '', cs2RankLabel: '', avatar: '' });

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
export const TournamentForm = ({ tournament, slots }) => {
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
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inviteCode: '',
      teamName: '',
      teamTag: '',
      teamRegion: '',
      logoLink: '',
      players: Array.from({ length: corePlayerCount }, blankPlayer)
    },
  });

  const [draftRestored, setDraftRestored] = useState(false);

  // ── Draft Restoration on Mount ──────────────────────────────────────────────
  useEffect(() => {
    // 1. Check for Dead-Letter Queue (LocalStorage, cross-session)
    const dlq = localStorage.getItem(`pp_dlq_${tournament.id}`);
    if (dlq) {
       try {
         setDlqItem(JSON.parse(dlq));
       } catch (e) {
         localStorage.removeItem(`pp_dlq_${tournament.id}`);
       }
    }

    // 2. Check for Session Draft (SessionStorage, single-session failure)
    const draftKey = `pp_draft_${tournament.id}`;
    const draft = sessionStorage.getItem(draftKey);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        reset(parsed);
        setDraftRestored(true);
        Terminal.success('Recovered form draft from previous failed session.');
      } catch (e) {
        sessionStorage.removeItem(draftKey);
      }
    }
  }, [reset, tournament.id]);

  const { fields, append, remove } = useFieldArray({ control, name: 'players' });

  // Substitutes calculations
  const maxSubs = tournament.substitutes?.max ?? 0;
  const currentSubs = fields.length - corePlayerCount;

  const { submit, isSubmitting, error, isSuccess } = useFormSubmit(tournament.id);
  const [submissionId, setSubmissionId] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const [dlqItem, setDlqItem] = useState(null);

  // ── Sub handling ────────────────────────────────────────────────────────────
  const handleAddSub = () => {
    if (currentSubs < maxSubs) {
      append(blankPlayer());
    }
  };

  const handleRemoveSub = () => {
    if (currentSubs > 0) {
      remove(fields.length - 1);
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
  const [faceitMeta, setFaceitMeta] = useState({});

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
        
        if (data.nickname) {
          setValue(`players.${index}.ign`, data.nickname, { shouldValidate: true });
        }
        if (data.avatar) {
          setValue(`players.${index}.avatar`, data.avatar);
        }
        
        setFaceitMeta((prev) => ({ 
          ...prev, 
          [index]: { source: data._source, fetchedAt: data._fetchedAt } 
        }));

        // Auto-populate Steam if blank and Faceit provided it
        if (data.steam64 && !getValues(`players.${index}.steam64`)) {
           setValue(`players.${index}.steam64`, data.steam64);
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
        { ign: "donk", steam: "https://steamcommunity.com/id/donk_test", faceit: "https://www.faceit.com/en/players/donk", discord: "donk_test" },
        { ign: "Spinx", steam: "https://steamcommunity.com/id/Spinx_test", faceit: "https://www.faceit.com/en/players/Spinx", discord: "spinx_test" },
        { ign: "apEX", steam: "https://steamcommunity.com/id/apEX_test", faceit: "https://www.faceit.com/en/players/apEX", discord: "apex_test" }
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
    const res = await submit(formData);
    if (res?.success) {
      setSubmissionId(res.submissionId);
      localStorage.removeItem(`pp_dlq_${tournament.id}`); // Clear DLQ on success
    }
  };

  // ─── SUCCESS STATE ────────────────────────────────────────────────────────
  if (isSuccess) {
    const ticketId = submissionId ? `PP-${submissionId.split('-')[0].toUpperCase()}-${submissionId.split('-')[1].toUpperCase()}` : 'PP-UNKNOWN';
    
    const handleCopy = () => {
      navigator.clipboard.writeText(submissionId || '');
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    };

    return (
      <div className="glass-panel p-8 md:p-16 text-center flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/5 to-transparent pointer-events-none" />
        <div className="hud-crosshair tl"></div><div className="hud-crosshair tr"></div><div className="hud-crosshair bl"></div><div className="hud-crosshair br"></div>
        
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-neon-cyan blur-[60px] opacity-20 rounded-full animate-pulse" />
          <CheckCircle2 className="w-24 h-24 text-neon-cyan relative z-10 drop-shadow-[0_0_20px_rgba(0,240,255,0.5)]" />
        </div>

        <div className="space-y-2 mb-10">
          <h2 className="text-5xl md:text-7xl font-black text-white font-heading uppercase tracking-tighter italic leading-none">
            ROSTER SECURED
          </h2>
          <p className="text-zinc-500 font-body text-sm font-bold uppercase tracking-[0.3em]">
            Transmission Received // Entry Serialized
          </p>
        </div>

        <div className="w-full max-w-md bg-black/60 border border-white/10 rounded-lg p-6 mb-10 relative">
          <div className="flex flex-col items-center gap-4">
             <div className="flex flex-col">
               <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1 font-body">Official Submission ID</span>
               <div className="flex items-center gap-3 bg-zinc-900 border border-white/5 px-4 py-3 rounded group/id cursor-pointer" onClick={handleCopy}>
                 <span className="text-xl font-heading text-neon-cyan tracking-[0.2em] font-black">{ticketId}</span>
                 {copiedId ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-zinc-600 group-hover/id:text-white transition-colors" />}
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-white/5">
                <div className="text-left">
                  <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest block font-body">Team</span>
                  <span className="text-sm font-heading text-white uppercase tracking-wider">{getValues('teamName') || 'Squad'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest block font-body">Timestamp</span>
                  <span className="text-sm font-heading text-white uppercase tracking-wider">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
             </div>
          </div>
          
          <div className="mt-6 p-3 bg-neon-cyan/5 border border-neon-cyan/20 rounded">
            <p className="text-[10px] text-neon-cyan font-bold uppercase tracking-widest leading-relaxed font-body">
              Take a screenshot or save this ID. It is required for check-in and appeals.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
           <button 
             onClick={() => window.location.reload()} 
             className="flex-1 py-4 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-all font-body rounded"
           >
             REGISTER ANOTHER TEAM
           </button>
           <button 
             onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} // Assumes tab switching logic is handled by parent, this just helps UI feel cohesive
             className="flex-1 py-4 bg-neon-cyan text-black font-bold uppercase tracking-widest text-xs hover:bg-white transition-all font-body rounded shadow-[0_0_20px_rgba(0,240,255,0.3)] flex items-center justify-center gap-2"
           >
             VIEW LIVE ROSTER <ExternalLink className="w-3 h-3" />
           </button>
        </div>
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
        <div className="flex items-center px-6 gap-2 border-l border-white/10 bg-white/5">
           <div className={`w-2 h-2 rounded-full ${!slots ? 'bg-zinc-500 animate-pulse' : slots === 'error' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'}`}></div>
           <span className="text-[9px] font-black font-body text-zinc-500 uppercase tracking-widest leading-none">
              {!slots ? 'SYNC...' : slots === 'error' ? 'OFFLINE' : 'ONLINE'}
           </span>
        </div>
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
          <div className="flex items-center gap-2 my-auto select-none bg-neon-purple/10 border border-neon-purple/35 rounded p-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 font-body px-2">
              Subs ({currentSubs}/{maxSubs})
            </span>
            <button
              type="button"
              disabled={currentSubs === 0}
              onClick={handleRemoveSub}
              className="w-8 h-8 flex items-center justify-center bg-black/40 border border-white/10 hover:border-red-500/50 hover:text-red-400 disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-zinc-500 rounded font-bold text-base leading-none transition-colors cursor-pointer select-none"
            >
              -
            </button>
            <button
              type="button"
              disabled={currentSubs === maxSubs}
              onClick={handleAddSub}
              className="w-8 h-8 flex items-center justify-center bg-black/40 border border-white/10 hover:border-neon-cyan/50 hover:text-neon-cyan disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-zinc-500 rounded font-bold text-base leading-none transition-colors cursor-pointer select-none"
            >
              +
            </button>
          </div>
        )}
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((field, index) => {
            const meta = getPlayerMeta(index, corePlayerCount);

            return (
              <div
                key={field.id}
                className="cyber-card p-6 relative overflow-hidden group"
              >
                {/* HUD Corner Accents */}
                <div className="hud-crosshair tl opacity-30 group-hover:opacity-100 transition-opacity" />
                <div className="hud-crosshair tr opacity-30 group-hover:opacity-100 transition-opacity" />
                <div className="hud-crosshair bl opacity-30 group-hover:opacity-100 transition-opacity" />
                <div className="hud-crosshair br opacity-30 group-hover:opacity-100 transition-opacity" />

                {/* Accent line */}
                <div className={`absolute top-0 left-0 w-full h-[3px] opacity-70 ${meta.lineClass}`} />

                {/* Card header */}
                <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    {getValues(`players.${index}.avatar`) ? (
                      <img 
                        src={getValues(`players.${index}.avatar`)} 
                        alt="Player Avatar" 
                        className="w-8 h-8 rounded-full border border-white/10 object-cover" 
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-zinc-600 font-bold uppercase">
                        P{index+1}
                      </div>
                    )}
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 font-body">
                      Player {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
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
                          readOnly={faceitStatus[index] === 'SUCCESS'}
                          placeholder={faceitStatus[index] === 'SUCCESS' ? 'Auto-filled from FACEIT' : "What you're called in-game"}
                          className={`input-ghost text-xs ${faceitStatus[index] === 'SUCCESS' ? 'text-zinc-400 bg-black/20 border-none select-none pointer-events-none' : ''}`}
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
                    {faceitMeta[index]?.source === 'csgo' && (
                       <p className="text-yellow-500 text-[9px] mt-1.5 font-bold uppercase tracking-wider font-body">
                         ⚠ Legacy CS:GO data detected. Ensure your CS2 profile is linked to avoid seeding errors.
                       </p>
                    )}
                  </div>



                  {/* FACEIT & CS2 Stat Badges */}
                  <Controller
                    control={control}
                    name={`players.${index}.faceitLevel`}
                    render={({ field: lvlField }) => {
                       const elo = getValues(`players.${index}.faceitElo`);
                       const rank = getValues(`players.${index}.cs2RankLabel`);
                       const state = faceitStatus[index];
                       const meta = faceitMeta[index];
                       const lvl = lvlField.value;

                       let badgeColor = 'bg-zinc-800 text-zinc-400 border-zinc-700';
                       if (state === 'FETCHING...') badgeColor = 'bg-cyan-900/30 text-neon-cyan border-neon-cyan animate-pulse';
                       else if (state === 'FAILED') badgeColor = 'bg-yellow-900/30 text-yellow-400 border-yellow-500';
                       else if (state === 'SUCCESS') {
                          const l = parseInt(lvl);
                          if (l <= 3) badgeColor = 'bg-zinc-800 text-white border-zinc-500';
                          else if (l <= 6) badgeColor = 'bg-green-900/30 text-green-400 border-green-500';
                          else if (l <= 8) badgeColor = 'bg-yellow-900/30 text-yellow-500 border-yellow-500';
                          else badgeColor = 'bg-red-900/30 text-red-500 border-red-500';
                       }

                       const fetchedAgo = meta ? Math.floor((Date.now() - meta.fetchedAt) / 1000) : 0;

                       return (
                         <div className="bg-black/40 border-t-2 border-white/10 rounded-t p-3 mt-2">
                           {meta?.source === 'csgo' && (
                             <div className="mb-3 flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded">
                               <AlertTriangle className="w-3 h-3 text-yellow-500" />
                               <span className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest leading-none">
                                 ELO pulled from CS:GO — may not reflect your CS2 rank.
                               </span>
                             </div>
                           )}
                           
                           <div className="flex gap-2 sm:gap-4">
                             <div className="flex flex-col flex-1">
                                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1 font-body">FACEIT LVL</span>
                                <div className={`px-2 py-1.5 flex items-center justify-center font-bold text-xs rounded border ${badgeColor}`}>
                                   {state === 'FETCHING...' ? 'FETCHING' : (state === 'FAILED' ? 'LINK ERROR' : (lvl || 'AWAITING LINK'))}
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
                           
                           {state === 'SUCCESS' && meta && (
                             <div className="mt-2 text-[8px] text-zinc-600 font-bold uppercase tracking-[0.2em] text-right">
                               Linked {fetchedAgo}s ago via Pixel-API
                             </div>
                           )}
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

  const FormSubmitSection = (
    <div className="glass-panel p-6 flex flex-col gap-4">
      {error && (
        <div className={`border p-6 flex flex-col items-center gap-4 animate-in zoom-in duration-300 shadow-2xl ${error.includes('PLAYER_BANNED') ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-orange-500/20' : 'bg-red-500/10 border-red-500 text-red-400 shadow-red-500/20'}`}>
          <div className="flex items-center gap-3">
             <AlertOctagon className="w-6 h-6 flex-shrink-0" />
             <span className="text-xs font-black uppercase tracking-[0.2em] leading-none">
               {error.includes('PLAYER_BANNED') ? 'ELIGIBILITY RESTRICTED' : 'TRANSMISSION FAILED'}
             </span>
          </div>
          
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-center max-w-sm leading-relaxed opacity-90 font-body">
            {error.replace('PLAYER_BANNED: ', '')}
          </p>

          {error.includes('PLAYER_BANNED') ? (
            <a 
              href="https://discord.gg/pixelpalace" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-2 px-6 py-3 bg-orange-500 text-black font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              OPEN SUPPORT TICKET (APPEAL) <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest opacity-50">Please verify your connection and try again.</span>
          )}
        </div>
      )}

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
  );

  // ─── FORM ROOT ────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8 pb-20">
      {dlqItem && !draftRestored && (
        <div className="glass-panel p-5 bg-orange-500/10 border border-orange-500/30 flex items-center justify-between gap-4 animate-in slide-in-from-top duration-700">
           <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-500/20 rounded">
                <ShieldAlert className="w-5 h-5 text-orange-400 animate-pulse" />
              </div>
              <div className="flex flex-col">
                 <span className="text-xs font-black text-orange-400 uppercase tracking-widest leading-none">Unsent Registration Detected</span>
                 <span className="text-[10px] text-zinc-400 font-body uppercase mt-1">Found unsent data for "{dlqItem.teamName}" from {new Date(dlqItem.timestamp).toLocaleDateString()}.</span>
              </div>
           </div>
           <div className="flex gap-2">
             <button 
               type="button" 
               onClick={() => { localStorage.removeItem(`pp_dlq_${tournament.id}`); setDlqItem(null); }}
               className="text-[9px] font-bold text-zinc-600 hover:text-white uppercase tracking-widest transition-colors font-body px-3"
             >
               DISCARD
             </button>
             <button 
               type="button" 
               onClick={() => { reset(dlqItem.formData); setDlqItem(null); setDraftRestored(true); }}
               className="bg-orange-500 text-black px-4 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-white transition-all transform hover:scale-105"
             >
               RESTORE & RETRY
             </button>
           </div>
        </div>
      )}

      {draftRestored && (
        <div className="glass-panel p-4 bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-between gap-4 animate-in slide-in-from-top duration-500">
           <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-neon-cyan animate-pulse" />
              <div className="flex flex-col">
                 <span className="text-xs font-bold text-neon-cyan uppercase tracking-widest leading-none">DRAFT RECOVERED</span>
                 <span className="text-[10px] text-zinc-400 font-body uppercase mt-1">We saved your previous attempt. Review and resubmit.</span>
              </div>
           </div>
           <button 
             type="button" 
             onClick={() => { sessionStorage.removeItem('pp_form_draft'); setDraftRestored(false); }}
             className="text-[9px] font-bold text-zinc-600 hover:text-white uppercase tracking-widest transition-colors font-body p-2"
           >
             DISMISS
           </button>
        </div>
      )}
      {TeamIdentity}
      {TeamRoster}
      {FormSubmitSection}
    </form>
  );
};
