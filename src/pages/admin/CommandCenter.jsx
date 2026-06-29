import React, { useState, useEffect } from 'react';
import { RefreshCw, LogOut, X, Map as MapIcon } from 'lucide-react';
import { SupabaseRepository } from '../../services/api/adapters/SupabaseRepository';

// --- CONFIGURATION ---
const MAPS = ['ANCIENT', 'DUST2', 'INFERNO', 'MIRAGE', 'NUKE', 'OVERPASS', 'TRAIN'];
const VETO_FLOW = { 
  "BO1": ["A:BAN","B:BAN","A:BAN","B:BAN","A:BAN","B:BAN"], 
  "BO3": ["A:BAN","B:BAN","A:PICK","B:PICK","A:BAN","B:BAN"], 
  "BO5": ["A:BAN","B:BAN","A:PICK","B:PICK","A:PICK","B:PICK"] 
};

export default function CommandCenter() {
  const [bracket, setBracket] = useState({});
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    // Auth Check
    SupabaseRepository.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) checkUserRole(session.user);
    }).catch(() => {
      setErrorMsg("Missing Database Configuration (Env Vars)");
    });

    const { data: authListener } = SupabaseRepository.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) checkUserRole(session.user);
    });

    fetchMatches();

    const channel = SupabaseRepository.subscribeToMatches(() => fetchMatches());

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
      SupabaseRepository.unsubscribe(channel);
    };
  }, []);

  const checkUserRole = (user) => {
    const admin = user?.app_metadata?.is_admin || false;
    setIsAdmin(admin);
  };

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const data = await SupabaseRepository.fetchMatches();
      const groups = { "R32": [], "R16": [], "QF": [], "SF": [], "GF": [] };
      
      (data || []).forEach(m => {
          let label = "R32"; 
          if(m.round === 1) label = "R32";
          if(m.round === 2) label = "R16"; 
          if(m.round === 3) label = "QF";
          if(m.round === 4) label = "SF";
          if(m.round === 5) label = "GF";
          
          if (!groups[label]) groups[label] = [];
          
          const vetoLog = m.metadata?.veto_log || [];
          const format = m.metadata?.format || 'BO1';
          const flow = VETO_FLOW[format] || VETO_FLOW['BO1'];
          
          let turn = "WAITING";
          let action = "";
          
          if (m.state === 'open' && vetoLog.length < flow.length) {
              const step = flow[vetoLog.length].split(":");
              turn = step[0] === "A" ? (m.player1?.display_name || "Team A") : (m.player2?.display_name || "Team B");
              action = step[1];
          } else if (m.state === 'open') {
               turn = "READY";
          }

          groups[label].push({
              id: m.id,
              teamA: m.player1?.display_name || 'TBD',
              teamB: m.player2?.display_name || 'TBD',
              p1_uid: m.player1?.user_id,
              p2_uid: m.player2?.user_id,
              winner: m.winner?.display_name,
              status: m.state === 'open' ? 'LIVE' : m.state.toUpperCase(),
              format: format,
              metadata: m.metadata || {},
              vetoLog: vetoLog,
              playerIP: m.metadata?.player_ip || 'HIDDEN',
              gotvIP: m.metadata?.gotv_ip || 'HIDDEN',
              turn: turn,
              action: action,
              nextSide: flow[vetoLog.length] ? flow[vetoLog.length].split(":")[0] : null
          });
      });

      setBracket(groups);
      
      if (selectedMatch) {
        for(const k in groups) {
          const found = groups[k].find(m => m.id === selectedMatch.id);
          if(found) setSelectedMatch(found);
        }
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setErrorMsg("Unable to connect to Tournament Database.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      await SupabaseRepository.loginViaDiscord();
    } catch (err) {
      alert("Login failed: " + err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await SupabaseRepository.logout();
    } catch (err) {
      console.error(err);
    }
  };

  // --- ACTIONS ---
  const handleVeto = async (mapName) => {
      if(!selectedMatch) return;
      const { vetoLog, format, nextSide, p1_uid, p2_uid } = selectedMatch;
      const flow = VETO_FLOW[format] || VETO_FLOW['BO1'];

      if (vetoLog.length >= flow.length) return;

      const isMyTurn = isAdmin || 
                       (nextSide === 'A' && session?.user?.id === p1_uid) || 
                       (nextSide === 'B' && session?.user?.id === p2_uid);

      if (!isMyTurn) { alert("Not your turn!"); return; }

      const step = flow[vetoLog.length].split(":");
      const action = step[1]; 
      const newLog = [...vetoLog, `${action} ${mapName}`];
      
      try {
        await SupabaseRepository.updateMatchVeto(selectedMatch.id, newLog, selectedMatch.metadata);
      } catch (err) {
        alert(err.message);
      }
  };

  const forceWin = async (winnerName) => {
    if(!isAdmin || !confirm(`Force win for ${winnerName}?`)) return;
    try {
      await SupabaseRepository.forceWin(selectedMatch.id);
      setSelectedMatch(null);
    } catch (err) {
      alert(err.message);
    }
  };

  // --- RENDER ---
  return (
    <div className="flex flex-col h-full bg-[#0b0c0f] text-[#e4e4e7] font-sans">
      <nav className="h-16 bg-[#12141a] border-b border-[#27272a] flex justify-between items-center px-6 shrink-0 z-40">
        <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-fuchsia-600 rounded flex items-center justify-center font-bold">P</div>
            <h1 className="font-brand text-2xl text-white tracking-wide">COMMAND <span className="text-fuchsia-500">CENTER</span></h1>
        </div>
        <div className="flex gap-3">
            {!session ? (
                <button onClick={handleLogin} className="bg-fuchsia-600 text-white text-xs font-bold px-4 py-1.5 rounded hover:bg-fuchsia-500 transition">LOGIN VIA DISCORD</button>
            ) : (
                <div className="flex gap-3 items-center">
                    <span className="text-[10px] font-bold text-black bg-white px-3 py-1 rounded uppercase tracking-widest">{isAdmin ? 'ADMIN' : 'CAPTAIN'}</span>
                    <button onClick={fetchMatches} className="text-zinc-400 hover:text-white"><RefreshCw className="w-5 h-5"/></button>
                    <button onClick={handleLogout} className="text-zinc-500 hover:text-red-500"><LogOut className="w-5 h-5"/></button>
                </div>
            )}
        </div>
      </nav>

      {errorMsg && <div className="bg-red-900/50 border-b border-red-500 p-2 text-center text-red-200 text-sm font-bold">{errorMsg}</div>}

      <div className="flex-grow bg-[#0b0c0f] relative overflow-x-auto">
        <div className="flex gap-10 p-10 h-full items-center min-w-max">
            {loading ? <div className="text-center w-full animate-pulse mt-20 font-brand text-2xl">CONNECTING TO DATABASE...</div> : 
             Object.keys(bracket).length === 0 ? <div className="text-center w-full mt-20 font-brand text-xl text-zinc-500">NO LIVE MATCHES FOUND</div> :
             Object.keys(bracket).map(roundKey => bracket[roundKey].length > 0 && (
                <div key={roundKey} className="flex flex-col justify-around w-60 shrink-0 h-[90%]">
                    <div className="text-center mb-4"><span className="bg-[#1c222b] px-3 py-1 rounded text-[10px] font-bold text-zinc-500 border border-zinc-800">{roundKey}</span></div>
                    {bracket[roundKey].map(m => (
                        <div key={m.id} onClick={() => setSelectedMatch(m)} className={`bg-[#18181b] border ${m.status==='LIVE' ? 'border-green-500 shadow-[0_4px_20px_rgba(34,197,94,0.15)]' : 'border-[#27272a] hover:border-fuchsia-500'} p-2.5 rounded-md cursor-pointer transition relative group transform hover:-translate-y-0.5 mb-2`}>
                            <div className={`flex justify-between text-[13px] font-semibold px-1.5 py-1 rounded ${m.winner===m.teamA ? 'text-green-500 bg-green-500/10' : ''}`}><span>{m.teamA}</span></div>
                            <div className={`flex justify-between text-[13px] font-semibold px-1.5 py-1 rounded ${m.winner===m.teamB ? 'text-green-500 bg-green-500/10' : ''}`}><span>{m.teamB}</span></div>
                            <div className="mt-2 flex justify-between items-center px-1">
                                <span className="text-[9px] text-zinc-600 font-mono truncate w-16">{m.id.split('-')[0]}</span>
                                <span className={`text-[9px] font-bold ${m.status==='LIVE'?'text-green-500':'text-zinc-500'}`}>{m.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
      </div>

      {selectedMatch && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-[#15191f] border border-[#27272a] w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl flex flex-col relative overflow-hidden">
                <div className="p-5 border-b border-[#27272a] flex justify-between items-center bg-[#1c222b]">
                    <div>
                        <h2 className="font-brand text-3xl text-white leading-none">{selectedMatch.id}</h2>
                        <span className="text-[10px] text-fuchsia-400 font-bold uppercase tracking-[0.2em]">{selectedMatch.status}</span>
                    </div>
                    <button onClick={() => setSelectedMatch(null)} className="text-zinc-500 hover:text-white"><X className="w-8 h-8"/></button>
                </div>

                <div className="flex-grow overflow-y-auto p-8 space-y-8">
                    <div className="flex justify-between items-center bg-black/40 p-6 rounded-lg border border-zinc-800">
                         <div className="text-right w-1/3">
                            <h2 className="text-4xl font-brand text-white truncate">{selectedMatch.teamA}</h2>
                            {isAdmin && <button onClick={() => forceWin(selectedMatch.teamA)} className="mt-2 text-[10px] bg-zinc-800 text-green-500 border border-green-900 px-3 py-1 rounded uppercase hover:bg-green-900/30">Force Win</button>}
                        </div>
                        <div className="text-center w-1/3 flex flex-col items-center">
                            <div className="text-zinc-600 font-black text-3xl">VS</div>
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded mt-2 border border-zinc-700">{selectedMatch.format}</span>
                        </div>
                        <div className="text-left w-1/3">
                            <h2 className="text-4xl font-brand text-white truncate">{selectedMatch.teamB}</h2>
                            {isAdmin && <button onClick={() => forceWin(selectedMatch.teamB)} className="mt-2 text-[10px] bg-zinc-800 text-green-500 border border-green-900 px-3 py-1 rounded uppercase hover:bg-green-900/30">Force Win</button>}
                        </div>
                    </div>

                    {(selectedMatch.playerIP !== 'HIDDEN' || isAdmin) && (
                        <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded text-center">
                             <p className="text-[10px] font-bold uppercase text-blue-400 mb-1">Server Connect</p>
                             <code className="text-sm text-blue-200 select-all cursor-pointer">connect {selectedMatch.playerIP}</code>
                        </div>
                    )}

                    <div className="bg-[#12141a] border border-[#27272a] rounded-lg p-6">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-white flex items-center gap-2"><MapIcon className="w-4 h-4 text-fuchsia-500"/> MAP VETO</h3>
                                <p className="text-[10px] text-zinc-500 mt-1">Captains take turns banning maps.</p>
                            </div>
                            <span className="text-xs font-bold text-yellow-500 bg-yellow-900/10 px-3 py-1 rounded border border-yellow-900/30 animate-pulse">
                                {selectedMatch.status === 'LIVE' ? (selectedMatch.turn === "READY" ? "VETO COMPLETE" : `${selectedMatch.turn} TO ${selectedMatch.action}`) : selectedMatch.status}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {MAPS.map(map => {
                                const isBanned = selectedMatch.vetoLog.some(l => l.includes(`BAN ${map}`));
                                const isPicked = selectedMatch.vetoLog.some(l => l.includes(`PICK ${map}`));
                                
                                const { vetoLog, format, nextSide, p1_uid, p2_uid } = selectedMatch;
                                const flow = VETO_FLOW[format] || VETO_FLOW['BO1'];
                                const isVetoComplete = vetoLog.length >= flow.length;
                                const isMyTurn = isAdmin || (nextSide === 'A' && session?.user?.id === p1_uid) || (nextSide === 'B' && session?.user?.id === p2_uid);
                                const clickable = !isBanned && !isPicked && isMyTurn && !isVetoComplete && selectedMatch.status === 'LIVE';

                                return (
                                    <div 
                                        key={map}
                                        onClick={() => clickable ? handleVeto(map) : null}
                                        className={`h-[70px] bg-cover bg-center rounded border flex items-center justify-center relative overflow-hidden group 
                                            ${isBanned ? 'border-red-500/50 grayscale opacity-40' : 'border-zinc-700'}
                                            ${isPicked ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : ''}
                                            ${clickable ? 'cursor-pointer hover:border-yellow-500 ring-1 ring-yellow-500/50' : ''}
                                        `}
                                        style={{ backgroundImage: `url('https://www.csgodatabase.com/images/maps/${map.toLowerCase()}.jpg')` }}
                                    >
                                        <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition"></div>
                                        <span className="relative z-10 font-bold text-white text-[10px] uppercase drop-shadow-md">{map}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
