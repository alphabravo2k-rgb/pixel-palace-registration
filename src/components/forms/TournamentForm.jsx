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

import React, { useState, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFormSubmit } from '../../hooks/useFormSubmit';
import { validateInviteCode } from '../../services/sheets';
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
} from 'lucide-react';

// ─── Dynamic Zod Schema ────────────────────────────────────────────────────────
// Built per-tournament so coreCount is encoded into the min() guard.
// All players in the form array are required — when a sub is added, they fill it.
// When a sub is removed via the toggle, the element is gone from the array.
const buildFormSchema = (tournament) => {
  const coreCount = tournament.playersPerTeam ?? 5;

  const playerSchema = z.object({
    discord: z.string().min(1, 'Discord handle required'),
    steam: z.string().min(1, 'Steam URL required'),
    faceit: z.string().min(1, 'FACEIT URL required'),
    rank: z.string().default('5'),
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
const blankPlayer = () => ({ discord: '', steam: '', faceit: '', rank: '5' });

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

        {/* Logo URL */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 block font-body">
            Team Logo URL <span className="text-red-500">*</span>
          </label>
          <div className="input-group">
            <ImageIcon className="ml-3 w-4 h-4 text-white/30" />
            <input
              {...register('logoLink')}
              type="url"
              placeholder="https://i.imgur.com/yourlogo.png"
              className="input-ghost"
            />
          </div>
          {errors.logoLink && (
            <p className="text-red-400 text-[10px] mt-1 font-body uppercase tracking-widest">
              {errors.logoLink.message}
            </p>
          )}
        </div>
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
                  {/* Discord — full width */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block font-body">
                      Discord Username <span className="text-red-500">*</span>
                    </label>
                    <div className="input-group">
                      <MessageSquare className="ml-3 w-4 h-4 text-white/30" />
                      <input
                        {...register(`players.${index}.discord`)}
                        type="text"
                        placeholder="e.g. s1mple"
                        className="input-ghost"
                      />
                    </div>
                    {errors.players?.[index]?.discord && (
                      <p className="text-red-400 text-[10px] mt-1 font-body">
                        {errors.players[index].discord.message}
                      </p>
                    )}
                  </div>

                  {/* Steam + FACEIT — side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block font-body">
                        Steam URL <span className="text-red-500">*</span>
                      </label>
                      <div className="input-group">
                        <Gamepad2 className="ml-3 w-4 h-4 text-white/30" />
                        <input
                          {...register(`players.${index}.steam`)}
                          type="url"
                          placeholder="steamcommunity.com/id/..."
                          className="input-ghost text-xs"
                        />
                      </div>
                      {errors.players?.[index]?.steam && (
                        <p className="text-red-400 text-[10px] mt-1 font-body">
                          {errors.players[index].steam.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block font-body">
                        FACEIT URL <span className="text-red-500">*</span>
                      </label>
                      <div className="input-group">
                        <Crosshair className="ml-3 w-4 h-4 text-white/30" />
                        <input
                          {...register(`players.${index}.faceit`)}
                          type="url"
                          placeholder="faceit.com/en/players/..."
                          className="input-ghost text-xs"
                        />
                      </div>
                      {errors.players?.[index]?.faceit && (
                        <p className="text-red-400 text-[10px] mt-1 font-body">
                          {errors.players[index].faceit.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* FACEIT Level — Controller for live display */}
                  <Controller
                    control={control}
                    name={`players.${index}.rank`}
                    defaultValue="5"
                    render={({ field: rankField }) => (
                      <div className="bg-black/40 border-b-2 border-white/10 rounded-t p-2 px-3 hover:bg-neon-cyan/5 hover:border-neon-cyan transition-colors">
                        <div className="flex justify-between items-center w-full mb-2">
                          <div className="flex items-center gap-2 text-zinc-400">
                            <Award className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] font-body">
                              FACEIT Level
                            </span>
                          </div>
                          <span className="text-xl font-heading text-neon-cyan drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
                            {rankField.value || '5'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          {...rankField}
                          className="cyber-slider"
                        />
                      </div>
                    )}
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

  const verificationItems = [
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
                {' '}—{' '}
                {item.body}
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
