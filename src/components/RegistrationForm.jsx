import { useReducer, useState, useEffect } from 'react';
import { AlertTriangle, Award, CheckCircle2, Crosshair, Gamepad2, Globe, Image as ImageIcon, Key, Loader2, MessageSquare, Tag, UserPlus, Users } from 'lucide-react';
import { getOrCreateSubmissionId, clearSubmissionId } from '../utils/idempotency';
import { submitToGateway } from '../services/api/client';
import { submissionReducer, SUBMISSION_STATES } from '../services/state/submissionMachine';
import { useToast } from '../contexts/ToastContext';
import { useAudio } from '../hooks/useAudio';

export default function RegistrationForm({ API_URL, tournamentId, deadlineDate }) {
  const [state, dispatch] = useReducer(submissionReducer, { status: SUBMISSION_STATES.IDLE, error: null });
  const { addToast } = useToast();
  const { playHover, playClick, playSuccess } = useAudio();
  
  const [formData, setFormData] = useState({
    agreed: false, inviteCode: '', logoLink: '',
    p1Discord: '', p1Faceit: '', p1Rank: '', p1Steam: '',
    p2Discord: '', p2Faceit: '', p2Rank: '', p2Steam: '',
    p3Discord: '', p3Faceit: '', p3Rank: '', p3Steam: '',
    p4Discord: '', p4Faceit: '', p4Rank: '', p4Steam: '',
    p5Discord: '', p5Faceit: '', p5Rank: '', p5Steam: '',
    p6Discord: '', p6Faceit: '', p6Rank: '', p6Steam: '',
    teamName: '', teamRegion: '', teamTag: ''
  });
  
  const [subActive, setSubActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState('--:--:--');
  const [vipStatus, setVipStatus] = useState('AWAITING INPUT...');

  useEffect(() => {
    if(!deadlineDate) return;
    const target = new Date(deadlineDate).getTime();
    const interval = setInterval(() => {
      const diff = target - new Date().getTime();
      if(diff < 0) {
        setTimeLeft('OFFLINE');
        clearInterval(interval);
      } else {
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${String(d).padStart(2,'0')}:${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [deadlineDate]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleVIPBlur = async () => {
    if (!formData.inviteCode) { setVipStatus('AWAITING INPUT...'); return; }
    setVipStatus('QUERYING...');
    try {
      const res = await fetch(`${API_URL}?validateCode=${encodeURIComponent(formData.inviteCode)}`);
      const data = await res.json();
      if (data.valid) {
        setVipStatus('CODE ACCEPTED');
        addToast('VIP Access Code accepted.', 'success');
      } else {
        setVipStatus('INVALID CODE');
        addToast('Invalid VIP Access Code.', 'error');
      }
    } catch { 
      setVipStatus('AWAITING INPUT...'); 
      addToast('Failed to verify VIP code.', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Custom Validation
    for (let i = 1; i <= 6; i++) {
      if (i === 6 && !subActive) continue;
      const faceit = formData[`p${i}Faceit`];
      const steam = formData[`p${i}Steam`];
      
      if (faceit && !faceit.includes('faceit.com')) {
        dispatch({ type: 'ERROR', payload: `Player ${i} FACEIT URL is invalid.` });
        addToast(`Player ${i} FACEIT URL is invalid. Must contain faceit.com.`, 'error');
        return;
      }
      if (steam && !steam.includes('steamcommunity.com')) {
        dispatch({ type: 'ERROR', payload: `Player ${i} Steam URL is invalid.` });
        addToast(`Player ${i} Steam URL is invalid. Must contain steamcommunity.com.`, 'error');
        return;
      }
    }

    dispatch({ type: 'START' });

    // Build the Canonical Payload mapping
    const roster = [];
    for (let i = 1; i <= 6; i++) {
      if (i === 6 && !subActive) continue;
      roster.push({
        discord: formData[`p${i}Discord`],
        steam: formData[`p${i}Steam`],
        faceit: formData[`p${i}Faceit`],
        rank: formData[`p${i}Rank`],
      });
    }

    const canonicalPayload = {
      submission_id: getOrCreateSubmissionId(),
      tournament_id: tournamentId,
      team: {
        team_name: formData.teamName,
        team_tag: formData.teamTag,
        region: formData.teamRegion,
        logo_url: formData.logoLink,
        invite_code: formData.inviteCode,
      },
      roster: roster,
      metadata: {
        submitted_at: new Date().toISOString(),
        source: "portal_v1",
        schema_version: "1.0",
        sub_included: subActive
      }
    };

    try {
      // Pass data to the abstraction layer
      await submitToGateway(canonicalPayload, API_URL);
      clearSubmissionId();
      dispatch({ type: 'SUCCESS' });
      playSuccess();
      addToast('Registration successful! Check the Live Tracker.', 'success', 6000);
    } catch (err) {
      dispatch({ type: 'ERROR', payload: err.message });
      addToast(err.message, 'error', 8000);
    }
  };

  if (state.status === SUBMISSION_STATES.SUCCESS) {
    return (
      <div className="elite-panel p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-[var(--neon-cyan)] blur-[30px] opacity-30 rounded-full"></div>
            <CheckCircle2 size={96} className="text-[var(--neon-cyan)] relative z-10" />
        </div>
        <h2 className="text-6xl font-black text-white mb-4 brand-font text-shadow-[0_0_20px_rgba(0,240,255,0.4)]">ROSTER SECURED</h2>
        <p className="text-zinc-400 text-xl data-font uppercase tracking-widest">Registration confirmed. Check the Live Roster Tracker.</p>
      </div>
    );
  }

  const renderPlayerCard = (i) => {
    if (i === 6 && !subActive) return null;
    const title = i === 1 ? 'CAPTAIN' : (i === 6 ? 'SUBSTITUTE' : 'STARTER');
    const colorClass = i === 1 ? 'text-yellow-400' : (i === 6 ? 'text-[var(--neon-pink)]' : 'text-white');
    const bgClass = i === 1 ? 'bg-yellow-500' : (i === 6 ? 'bg-[var(--neon-pink)]' : 'bg-white');
    const dotClass = i === 1 ? 'bg-yellow-400' : (i === 6 ? 'bg-[var(--neon-pink)]' : 'bg-[var(--neon-cyan)]');

    return (
      <div key={`player-${i}`} className="dossier-card p-6 transition-opacity duration-300">
        <div className={`dossier-line ${bgClass}`}></div>
        <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-3">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 data-font">Player 0{i}</span>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${dotClass} animate-pulse`}></div>
            <span className={`text-xs font-bold uppercase tracking-widest ${colorClass} data-font`}>{title}</span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="input-group">
            <MessageSquare size={16}/>
            <input type="text" name={`p${i}Discord`} onChange={handleChange} required={i!==6} placeholder="Discord Username" className="input-ghost"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <Gamepad2 size={16}/>
              <input type="url" name={`p${i}Steam`} onChange={handleChange} required={i!==6} placeholder="Steam URL" className="input-ghost"/>
            </div>
            <div className="input-group">
              <Crosshair size={16}/>
              <input type="url" name={`p${i}Faceit`} onChange={handleChange} required={i!==6} placeholder="FACEIT URL" className="input-ghost"/>
            </div>
          </div>
          <div className="input-group">
            <Award size={16}/>
            <select name={`p${i}Rank`} onChange={handleChange} required={i!==6} className="input-ghost w-full" defaultValue="">
              <option value="" disabled>Select Rank...</option>
              <option value="Level 1-3">Level 1-3</option>
              <option value="Level 4-7">Level 4-7</option>
              <option value="Level 8-9">Level 8-9</option>
              <option value="Level 10">Level 10</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* TIME LEFT */}
      <div className="elite-panel p-6 border-l-4 border-l-[var(--neon-pink)] max-w-sm mx-auto text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--neon-pink)] mb-2 font-bold data-font">Registration Closes In</p>
          <p className={`text-5xl brand-font tracking-widest text-shadow-[0_0_15px_rgba(240,0,255,0.5)] ${timeLeft === 'OFFLINE' ? 'text-red-500' : 'text-white'}`}>{timeLeft}</p>
      </div>

      {/* TEAM IDENTITY */}
      <div className="elite-panel p-0 overflow-hidden">
        <div className="flex items-stretch bg-black/50 border-b border-white/10">
          <div className="bg-[var(--neon-purple)] px-5 flex items-center justify-center font-bold brand-font text-3xl text-white italic">01</div>
          <h2 className="text-3xl text-white brand-font tracking-wider pl-6 py-4 flex-grow italic">TEAM IDENTITY</h2>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-full relative mb-2">
            <div className="absolute -left-4 top-0 w-1 h-full bg-[var(--neon-pink)] shadow-[0_0_10px_rgba(240,0,255,0.5)]"></div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--neon-pink)] data-font">VIP Access Code (Optional)</label>
              <span className={`text-[10px] font-bold uppercase data-font ${vipStatus.includes('ACCEPTED') ? 'text-[var(--neon-cyan)]' : vipStatus.includes('INVALID') ? 'text-red-500' : 'text-zinc-500'}`}>{vipStatus}</span>
            </div>
            <div className="input-group">
              <Key size={16}/><input type="text" name="inviteCode" onBlur={handleVIPBlur} onChange={handleChange} placeholder="Leave blank if none" className="input-ghost"/>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 block data-font">Registered Team Name</label>
            <div className="input-group"><Users size={16}/><input type="text" name="teamName" required onChange={handleChange} placeholder="e.g. Natus Vincere" className="input-ghost text-lg"/></div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 block data-font">Team Tag</label>
            <div className="input-group"><Tag size={16}/><input type="text" name="teamTag" required pattern="[A-Za-z0-9]+" onChange={handleChange} placeholder="e.g. NAVI" className="input-ghost"/></div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 block data-font">Server Region</label>
            <div className="input-group"><Globe size={16}/>
              <select name="teamRegion" required onChange={handleChange} className="input-ghost" defaultValue="">
                <option value="" disabled>Select Region...</option>
                <option value="IND">India (IND)</option>
                <option value="PAK">Pakistan (PAK)</option>
                <option value="ME">Middle East (ME)</option>
              </select>
            </div>
          </div>
          <div className="col-span-full">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 block data-font">Team Logo URL</label>
            <div className="input-group"><ImageIcon size={16}/><input type="url" name="logoLink" required onChange={handleChange} placeholder="e.g. https://i.imgur.com/yourlogo.png" className="input-ghost"/></div>
          </div>
        </div>
      </div>

      {/* ROSTER */}
      <div className="elite-panel p-0 overflow-hidden">
        <div className="flex items-stretch justify-between bg-black/50 border-b border-white/10 pr-6">
          <div className="flex items-stretch">
            <div className="bg-[var(--neon-cyan)] px-5 flex items-center justify-center font-bold brand-font text-3xl text-black italic">02</div>
            <h2 className="text-3xl text-white brand-font tracking-wider pl-6 py-4 italic">TEAM ROSTER</h2>
          </div>
          <div onClick={() => { playClick(); setSubActive(!subActive); }} onMouseEnter={playHover} className="flex items-center gap-3 bg-[var(--neon-purple)]/20 px-5 py-3 rounded border border-[var(--neon-purple)]/50 cursor-pointer group transition-all shadow-[0_0_15px_rgba(138,43,226,0.3)] my-auto highlight-toggle">
            <UserPlus size={20} className="text-[var(--neon-pink)]" />
            <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-white data-font drop-shadow-md">Add Substitute</span>
            <div className={`relative w-12 h-6 rounded-full border border-white/20 transition-colors duration-300 ml-2 ${subActive ? 'bg-[var(--neon-cyan)]' : 'bg-black'}`}>
              <div className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${subActive ? 'translate-x-[24px] bg-white' : 'bg-zinc-400'}`}></div>
            </div>
          </div>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4,5,6].map(i => renderPlayerCard(i))}
        </div>
      </div>

      {/* VERIFICATION */}
      <div className="elite-panel p-0 overflow-hidden">
        <div className="flex items-stretch bg-black/50 border-b border-white/10">
          <div className="bg-white px-5 flex items-center justify-center font-bold brand-font text-3xl text-black italic">03</div>
          <h2 className="text-3xl text-white brand-font tracking-wider pl-6 py-4 flex-grow italic">FINAL VERIFICATION</h2>
        </div>
        <div className="p-8">
          <div className="space-y-4 mb-10 data-font">
            <label onMouseEnter={playHover} className="flex items-center gap-4 p-5 bg-black/50 border border-white/5 cursor-pointer hover:border-[var(--neon-cyan)] transition-colors group rounded shadow-inner">
              <input type="checkbox" required onChange={(e)=>setFormData(prev => ({...prev, agreed: e.target.checked}))} className="w-5 h-5 accent-[var(--neon-cyan)] rounded-sm flex-shrink-0 cursor-pointer" />
              <span className="text-sm text-zinc-400 group-hover:text-white transition-colors leading-relaxed">I confirm Akros Anti-Cheat will be active, all players are in the Discord, and we consent to data processing.</span>
            </label>
          </div>
          
          <button onClick={playClick} onMouseEnter={playHover} type="submit" disabled={state.status === SUBMISSION_STATES.SUBMITTING || timeLeft === 'OFFLINE'} className="btn-ignite w-full flex justify-center items-center gap-3">
            {state.status === SUBMISSION_STATES.SUBMITTING ? <><Loader2 className="animate-spin" /> TRANSMITTING...</> : <span>SUBMIT REGISTRATION</span>}
          </button>
        </div>
      </div>
    </form>
  );
}
