import {
  Award,
  Calendar,
  Clock,
  ExternalLink,
  Gamepad2,
  Globe,
  MessageCircle,
  Shield,
  ShieldAlert,
  Trophy,
  Users
} from 'lucide-react';
import React, { useState } from 'react';

import { formatEsportsDate, formatEsportsTime } from '../../utils/dateHelper';

export const DiscordGate = ({ tournament, onAccept }) => {
  const [shake, setShake] = useState(false);

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
        key: 'voicecomms',
        label: 'VOICE COMMS',
        body: `All players confirm to join Pixel Voice Channels during their matches.`,
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
      if (onAccept) {
        onAccept();
      }
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  if (!tournament) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#030305]/95 backdrop-blur-lg p-4 overflow-y-auto">
      <div
        className={`bg-zinc-950 border border-neon-cyan/20 rounded-sm p-6 md:p-8 max-w-4xl w-full my-8 relative overflow-hidden shadow-[0_0_80px_rgba(0,240,255,0.08)] ${shake ? 'animate-shake' : ''}`}
      >
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink" />
        <div className="hud-crosshair tl" /><div className="hud-crosshair tr" /><div className="hud-crosshair bl" /><div className="hud-crosshair br" />

        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-neon-cyan/10 border border-neon-cyan/40 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            <Award className="w-6 h-6 text-neon-cyan" />
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-heading text-white text-center uppercase tracking-[0.15em] leading-tight mb-1">
          TOURNAMENT GATEWAY
        </h2>
        <p className="text-zinc-500 text-xs text-center font-body tracking-[0.2em] mb-8">
          <span className="block uppercase">Pixel Palace Community Cup 2</span>
          <span className="block mt-2 font-bold text-neon-cyan">Rules & Agreements</span>
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          {/* Left Column: Tournament Datastream / Briefing */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-black/40 border border-white/5 p-5 rounded-sm">
            <div>
              <div className="text-[10px] font-black font-body text-neon-cyan uppercase tracking-[0.25em] mb-1">
                MISSION BRIEFING
              </div>
              <h3 className="text-xl font-heading text-white uppercase tracking-wider leading-none mb-5">
                TOURNAMENT INTEL
              </h3>

              <div className="space-y-4">
                {/* Game Mode */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center flex-shrink-0">
                    <Gamepad2 className="w-4 h-4 text-neon-cyan" />
                  </div>
                  <div>
                    <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-body">GAME & FORMAT</div>
                    <div className="text-xs text-white font-bold uppercase font-body">{tournament.gameMode} ({tournament.format})</div>
                  </div>
                </div>

                {/* Tournament Date */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neon-pink/10 border border-neon-pink/30 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-neon-pink" />
                  </div>
                  <div>
                    <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-body">TOURNAMENT DATES</div>
                    <div className="text-xs text-white font-bold font-body">
                      {tournament.displayDate ? `${tournament.displayDate}, ${tournament.displayYear}` : formatEsportsDate(tournament.tournamentDate)}
                    </div>
                  </div>
                </div>

                {/* Registration Deadline */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-neon-purple" />
                  </div>
                  <div>
                    <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-body">REGISTRATION DEADLINE</div>
                    <div className="text-xs text-white font-bold uppercase font-body">
                      {formatEsportsDate(tournament.registrationDeadline)} <span className="text-neon-purple">@</span> {formatEsportsTime(tournament.registrationDeadline)}
                    </div>
                  </div>
                </div>

                {/* Prize Pool */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div>
                    <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-body">PRIZE POOL</div>
                    <div className="text-xs text-yellow-400 font-bold uppercase font-body">{tournament.prizePool}</div>
                  </div>
                </div>

                {/* Roster Size */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-neon-cyan" />
                  </div>
                  <div>
                    <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-body">ROSTER LIMITS</div>
                    <div className="text-xs text-white font-bold uppercase font-body">
                      {tournament.playersPerTeam} Players {tournament.substitutes ? `(Max ${tournament.substitutes.max} Subs)` : ''}
                    </div>
                  </div>
                </div>

                {/* Anti-Cheat */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-400/10 border border-green-400/30 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-body">ANTI-CHEAT SYSTEM</div>
                    <div className="text-xs text-green-400 font-bold uppercase font-body">{tournament.antiCheat || 'Akros'} REQUIRED</div>
                  </div>
                </div>

                {/* Server Location */}
                {tournament.serverLocation && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-500/10 border border-zinc-500/30 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div>
                      <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-body">SERVER LOCATION</div>
                      <div className="text-xs text-white font-bold uppercase font-body">{tournament.serverLocation}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/5 text-[9px] text-zinc-500 uppercase tracking-wider leading-relaxed font-body">
              SYSTEM REPORT: ALL REQS ACTIVE // CLIENT CONFIRMATION REQUIRED
            </div>
          </div>

          {/* Right Column: Agreements & Discord verification */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="bg-black/40 border border-white/5 p-5 rounded-sm">
                <h3 className="text-xs font-bold font-heading text-white uppercase tracking-widest mb-2.5 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-neon-purple" /> Discord Integration Required
                </h3>
                <p className="text-zinc-400 text-xs font-body leading-relaxed mb-4">
                  Match lobbies, check-ins, and direct admin coordination will be managed strictly on our Discord server. All players must be present inside the server.
                </p>
                <a
                  href={tournament?.discordInviteUrl || "https://discord.com/invite/pixelpalacee"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold uppercase tracking-widest rounded-sm transition-colors shadow-lg font-body"
                >
                  Join Discord Server <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="space-y-3">
                <div className="text-[10px] font-black font-body text-neon-pink uppercase tracking-widest mb-1">
                  Acknowledge & Confirm Roster Rules:
                </div>

                {verificationItems.map((item, i) => (
                  <label
                    key={item.key}
                    className={`flex items-start gap-4 p-3 bg-black/60 border rounded-sm cursor-pointer transition-all duration-300 ${checkedStates[i]
                        ? 'border-neon-cyan/40 bg-neon-cyan/5 shadow-[inset_0_0_15px_rgba(0,240,255,0.03)]'
                        : 'border-white/5 hover:border-white/15'
                      }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 w-5 h-5 accent-neon-cyan flex-shrink-0 cursor-pointer"
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
            </div>
          </div>
        </div>

        <button
          onClick={handleProceed}
          className={`w-full py-4 font-bold uppercase tracking-widest text-xs transition-all duration-300 rounded-sm font-body ${allChecked
              ? 'bg-neon-cyan text-black hover:bg-white hover:text-black shadow-[0_0_25px_rgba(0,240,255,0.3)] cursor-pointer'
              : 'bg-zinc-900/50 text-zinc-600 cursor-not-allowed border border-zinc-800/50'
            }`}
        >
          {allChecked ? 'Proceed to Registration Form' : 'Acknowledge all requirements to proceed'}
        </button>

        {!allChecked && (
          <div className="mt-4 flex items-center justify-center gap-2 text-yellow-500/70 text-[9px] font-bold uppercase tracking-widest font-body">
            <ShieldAlert className="w-3.5 h-3.5" /> Agreement verification required to unlock registration page
          </div>
        )}
      </div>
    </div>
  );
};
