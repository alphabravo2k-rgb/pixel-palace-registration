/**
 * Match Center MVP Administrative Dashboard with Diagnostics Inspectors
 */
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMatchCenter } from '../hooks/useMatchCenter.js';

export function MatchCenterDashboard() {
  const { matchId } = useParams();
  const {
    summary,
    scoreboard,
    timeline,
    diagnostics,
    loading,
    error,
    clearError,
    createMatch,
    assignTeams,
    startCheckIn,
    startWarmup,
    startSideSelection,
    startMapSelection,
    startLive,
    pause,
    resume,
    recordRound,
    completeMap,
    completeMatch,
    overrideScore,
    archive,
    syncLotMatch,
    updateStageAndRound,
  } = useMatchCenter(matchId || 'MC-2026-0000001');

  const [overrideA, setOverrideA] = useState('');
  const [overrideB, setOverrideB] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [stageInput, setStageInput] = useState('');
  const [roundInput, setRoundInput] = useState('');

  React.useEffect(() => {
    if (summary) {
      setStageInput(summary.stage || 'Single Elimination');
      setRoundInput(summary.round || 1);
    }
  }, [summary]);

  const handleApplyStageRound = (e) => {
    e.preventDefault();
    if (!stageInput || !roundInput) {
      alert('Both Stage and Round are required.');
      return;
    }
    updateStageAndRound(stageInput, Number(roundInput));
    alert('Match Stage and Round updated successfully!');
  };

  // Dynamic LOT API input — accepts match ID or full URL
  const [lotInput, setLotInput] = useState('https://fluxbot.lotgaming.xyz/api/matches/736');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white font-mono">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-4">Loading Match Projections...</span>
      </div>
    );
  }

  const handleCreateDummy = async () => {
    await createMatch('Counter-Strike 2', 'BO3');
    await assignTeams(
      { teamId: 'T1', tag: 'ASTR', name: 'Astralis', players: ['device', 'stavn', 'jabbi', 'Staehr', 'br0'] },
      { teamId: 'T2', tag: 'NAVI', name: 'Natus Vincere', players: ['jL', 'Aleksib', 'iM', 'w0nderful', 'b1t'] }
    );
  };

  const handleApplyOverride = async (e) => {
    e.preventDefault();
    if (overrideA === '' || overrideB === '' || !overrideReason) {
      alert('All override fields are required.');
      return;
    }
    await overrideScore(Number(overrideA), Number(overrideB), overrideReason, 'Admin');
    setOverrideA('');
    setOverrideB('');
    setOverrideReason('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-mono">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
        <div>
          <div className="flex items-center space-x-3">
            <span className="px-2 py-0.5 text-xs bg-indigo-500 text-white font-bold rounded animate-pulse">BETA</span>
            <h1 className="text-2xl font-bold tracking-tight text-white">Match Center Dashboard</h1>
          </div>
          <p className="text-slate-400 text-xs">Platform Core System Identifier: {matchId || 'MC-2026-0000001'}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* LOT API Ingestion — accepts full URL or bare match ID */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 gap-2">
            <span className="text-[9px] text-slate-500 font-bold uppercase shrink-0">LOT API:</span>
            <input
              type="text"
              value={lotInput}
              onChange={e => setLotInput(e.target.value)}
              placeholder="https://fluxbot.lotgaming.xyz/api/matches/736 or 21"
              className="w-72 bg-transparent text-white font-mono text-[10px] focus:outline-none placeholder-slate-700"
            />
            <button
              onClick={() => syncLotMatch(lotInput)}
              disabled={loading}
              className="text-[10px] bg-emerald-950 hover:bg-emerald-900 disabled:opacity-50 text-emerald-300 border border-emerald-800 rounded px-2.5 py-1 transition font-bold shrink-0"
            >
              {loading ? '...' : 'Sync'}
            </button>
          </div>
          <Link to="/" className="text-xs text-slate-400 hover:text-indigo-400 border border-slate-800 rounded px-3 py-1.5 transition">
            Return Home
          </Link>
        </div>
      </header>


      {/* Diagnostics Telemetry bar */}
      {summary && (
        <section className="grid grid-cols-2 md:grid-cols-7 gap-4 bg-slate-900 border border-slate-800 rounded p-4 mb-6 text-[10px] text-slate-300">
          <div>
            <span className="block text-slate-500 uppercase font-semibold">Aggregate Version</span>
            <span className="text-white font-bold">{diagnostics.aggregateVersion}</span>
          </div>
          <div>
            <span className="block text-slate-500 uppercase font-semibold">Projection Version</span>
            <span className="text-white font-bold">{diagnostics.projectionVersion}</span>
          </div>
          <div>
            <span className="block text-slate-500 uppercase font-semibold">Projection Lag</span>
            <span className={`font-bold ${diagnostics.projectionLag > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {diagnostics.projectionLag} events
            </span>
          </div>
          <div>
            <span className="block text-slate-500 uppercase font-semibold">Current Provider</span>
            <span className="text-white font-bold">{diagnostics.currentProvider}</span>
          </div>
          <div>
            <span className="block text-slate-500 uppercase font-semibold">Last Provider Poll</span>
            <span className="text-white font-bold">{diagnostics.lastProviderPoll}</span>
          </div>
          <div>
            <span className="block text-slate-500 uppercase font-semibold">Health Status</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950 text-emerald-300 font-bold border border-emerald-800">
              {diagnostics.healthStatus}
            </span>
          </div>
          <div className="col-span-2 md:col-span-1 overflow-hidden truncate">
            <span className="block text-slate-500 uppercase font-semibold">Correlation ID</span>
            <span className="text-white font-bold text-[9px] cursor-pointer" title={diagnostics.correlationId}>{diagnostics.correlationId}</span>
          </div>
        </section>
      )}

      {/* Error Notifications */}
      {error && (
        <div className="bg-rose-950/40 border border-rose-800 text-rose-200 p-4 rounded mb-6 text-xs flex justify-between items-center">
          <span><strong>Invariants Alert:</strong> {error}</span>
          <button onClick={clearError} className="hover:text-rose-100 font-bold ml-4">Dismiss</button>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Left Column: Match Status & Scoreboard */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Roster & Score Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-3xl rounded-full"></div>
            
            {!summary ? (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm mb-4">No active match found for this stream ID.</p>
                <div className="flex flex-col md:flex-row justify-center items-center space-y-3 md:space-y-0 md:space-x-4">
                  <button onClick={handleCreateDummy} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded shadow transition">
                    Initialize Astralis vs NAVI BO3
                  </button>
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded px-3 py-1.5 space-x-2">
                    <input type="text" value={lotInput} onChange={e => setLotInput(e.target.value)} placeholder="URL or match ID" className="w-48 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white font-mono text-xs focus:outline-none" />
                    <button onClick={() => syncLotMatch(lotInput)} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded shadow transition">
                      Fetch & Sync LOT Match
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {/* Meta details */}
                <div className="text-center mb-4">
                  <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded uppercase font-semibold">
                    {summary.game} ({summary.format})
                  </span>
                  <div className="mt-2 text-xs text-slate-400">
                    Status: <span className={`font-bold ${summary.status === 'Live' ? 'text-emerald-400' : 'text-slate-300'}`}>{summary.status}</span>
                  </div>
                </div>

                {/* Score Grid */}
                <div className="flex items-center justify-between w-full max-w-md my-4">
                  <div className="text-center flex-1">
                    <div className="text-xl font-bold text-white">{summary.teamA ? summary.teamA.name : 'Team A'}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{summary.teamA ? summary.teamA.tag : 'T1'}</div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-3xl font-black text-white px-8 bg-slate-950/80 border border-slate-800 py-3 rounded-lg">
                    <span>{scoreboard?.score?.teamAScore ?? 0}</span>
                    <span className="text-slate-600 font-normal">:</span>
                    <span>{scoreboard?.score?.teamBScore ?? 0}</span>
                  </div>

                  <div className="text-center flex-1">
                    <div className="text-xl font-bold text-white">{summary.teamB ? summary.teamB.name : 'Team B'}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{summary.teamB ? summary.teamB.tag : 'T2'}</div>
                  </div>
                </div>

                {/* Series Scores */}
                {summary.status !== 'Scheduled' && (
                  <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-3 w-full text-center">
                    Series Score: <span className="text-white font-bold">{summary.score?.teamAScore ?? 0} maps</span> vs <span className="text-white font-bold">{summary.score?.teamBScore ?? 0} maps</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Operational Console Panel (Referee controls) */}
          {summary && (
            <div className="bg-slate-900 border border-slate-800 rounded p-6 shadow-xl">
              <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-2 mb-4 uppercase tracking-wider">
                Operational Referee Console
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button onClick={startCheckIn} disabled={summary.status !== 'Scheduled'} className="py-2 px-3 border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs font-bold rounded transition disabled:opacity-40">
                  1. Check In
                </button>
                <button onClick={startWarmup} disabled={summary.status !== 'Check-In'} className="py-2 px-3 border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs font-bold rounded transition disabled:opacity-40">
                  2. Warmup
                </button>
                <button onClick={startSideSelection} disabled={summary.status !== 'Preparation'} className="py-2 px-3 border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs font-bold rounded transition disabled:opacity-40">
                  3. Side Selection
                </button>
                <button onClick={startMapSelection} disabled={summary.status !== 'SideSelection'} className="py-2 px-3 border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs font-bold rounded transition disabled:opacity-40">
                  4. Map Selection
                </button>
                <button onClick={startLive} disabled={summary.status !== 'MapSelection'} className="py-2 px-3 border border-emerald-900/60 hover:border-emerald-800 bg-emerald-950/40 text-emerald-300 text-xs font-bold rounded transition disabled:opacity-40">
                  5. Start Live
                </button>
                <button onClick={completeMap} disabled={summary.status !== 'Live'} className="py-2 px-3 border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs font-bold rounded transition disabled:opacity-40">
                  6. Complete Map
                </button>
                <button onClick={() => completeMatch(summary.teamA?.teamId || 'T1')} disabled={summary.status !== 'Live' && summary.status !== 'Paused'} className="py-2 px-3 border border-indigo-900/50 hover:border-indigo-800 bg-indigo-950/40 text-indigo-300 text-xs font-bold rounded transition disabled:opacity-40">
                  End: Win Team A
                </button>
                <button onClick={() => completeMatch(summary.teamB?.teamId || 'T2')} disabled={summary.status !== 'Live' && summary.status !== 'Paused'} className="py-2 px-3 border border-indigo-900/50 hover:border-indigo-800 bg-indigo-950/40 text-indigo-300 text-xs font-bold rounded transition disabled:opacity-40">
                  End: Win Team B
                </button>
                <button onClick={archive} disabled={summary.status !== 'Completed'} className="py-2 px-3 border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs font-bold rounded transition disabled:opacity-40">
                  Archive Match
                </button>
              </div>

              {/* In-Game Scoring controls */}
              {summary.status === 'Live' && (
                <div className="mt-6 border-t border-slate-800/80 pt-6">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Record Map Round Winners</h3>
                  <div className="flex space-x-4">
                    <button onClick={() => recordRound('teamA')} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded transition shadow">
                      +1 {summary.teamA?.name || 'Team A'} Round
                    </button>
                    <button onClick={() => recordRound('teamB')} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded transition shadow">
                      +1 {summary.teamB?.name || 'Team B'} Round
                    </button>
                  </div>
                </div>
              )}

              {/* Pause Controls */}
              {summary.status === 'Live' && (
                <div className="mt-4 flex space-x-3">
                  <button onClick={() => pause('technical')} className="flex-1 py-2 border border-yellow-900/60 bg-yellow-950/20 hover:bg-yellow-950/30 text-yellow-300 text-xs rounded transition">
                    Technical Pause
                  </button>
                  <button onClick={() => pause('tactical')} className="flex-1 py-2 border border-yellow-900/60 bg-yellow-950/20 hover:bg-yellow-950/30 text-yellow-300 text-xs rounded transition">
                    Tactical Pause
                  </button>
                </div>
              )}
              {summary.status === 'Paused' && (
                <button onClick={resume} className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded transition">
                  Resume Match
                </button>
              )}
            </div>
          )}

        </div>

        {/* Right Column: Score Overrides */}
        <div className="space-y-6">
          
          {/* Manual Overrides Form */}
          {summary && (
            <div className="bg-slate-900 border border-slate-800 rounded p-6 shadow-xl">
              <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-2 mb-4 uppercase tracking-wider">
                Manual Score Override
              </h2>
              
              <form onSubmit={handleApplyOverride} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">{summary.teamA ? summary.teamA.tag : 'T1'} Score</label>
                    <input type="number" min="0" value={overrideA} onChange={e => setOverrideA(e.target.value)} placeholder="0" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">{summary.teamB ? summary.teamB.tag : 'T2'} Score</label>
                    <input type="number" min="0" value={overrideB} onChange={e => setOverrideB(e.target.value)} placeholder="0" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Override Reason</label>
                  <input type="text" value={overrideReason} onChange={e => setOverrideReason(e.target.value)} placeholder="e.g., Server crash round replay" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500" />
                </div>

                <button type="submit" className="w-full py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs rounded transition shadow">
                  Apply Score Override
                </button>
              </form>
            </div>
          )}

          {/* Stage & Round Settings Form */}
          {summary && (
            <div className="bg-slate-900 border border-slate-800 rounded p-6 shadow-xl mt-6">
              <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-2 mb-4 uppercase tracking-wider">
                Stage & Round Configuration
              </h2>
              
              <form onSubmit={handleApplyStageRound} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Tournament Stage</label>
                  <select 
                    value={stageInput} 
                    onChange={e => setStageInput(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Single Elimination">Single Elimination (Playoffs)</option>
                    <option value="Swiss Stage">Swiss Stage</option>
                    <option value="Group Stage">Group Stage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Round Number</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={roundInput} 
                    onChange={e => setRoundInput(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-500" 
                  />
                </div>

                <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded transition shadow">
                  Update Stage & Round
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

      {/* Diagnostics Inspectors Grid */}
      {summary && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-slate-800 pt-8">
          
          {/* 1. Aggregate Inspector */}
          <div className="bg-slate-900 border border-slate-800 rounded p-4 shadow-lg text-xs">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2 mb-3 uppercase tracking-wider">
              Aggregate Inspector
            </h3>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span className="text-slate-400">Current Version:</span>
                <span className="text-white font-bold">{diagnostics.aggregateVersion}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">Expected Version:</span>
                <span className="text-white font-bold">{diagnostics.expectedVersion}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">Snapshot Version:</span>
                <span className="text-indigo-400 font-bold">{diagnostics.snapshotVersion}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">Aggregate State:</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-950 text-slate-300 font-bold border border-slate-800">
                  {summary.status}
                </span>
              </li>
            </ul>
          </div>

          {/* 2. Projection Inspector */}
          <div className="bg-slate-900 border border-slate-800 rounded p-4 shadow-lg text-xs">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2 mb-3 uppercase tracking-wider">
              Projection Inspector
            </h3>
            <ul className="space-y-2">
              <li className="flex justify-between items-center">
                <span className="text-slate-400">Summary:</span>
                <span className="text-white font-bold">v{summary.lastEventSeq} <span className="text-emerald-400 ml-1">● Healthy</span></span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-slate-400">Scoreboard:</span>
                <span className="text-white font-bold">
                  v{scoreboard?.lastEventSeq || 0}
                  <span className={scoreboard ? "text-emerald-400 ml-1" : "text-amber-400 ml-1"}>
                    {scoreboard ? "● Healthy" : "● Init"}
                  </span>
                </span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-slate-400">Timeline:</span>
                <span className="text-white font-bold">
                  v{timeline.length > 0 ? timeline[timeline.length - 1].aggregateVersion || diagnostics.projectionVersion : 0}
                  <span className={timeline.length > 0 ? "text-emerald-400 ml-1" : "text-amber-400 ml-1"}>
                    {timeline.length > 0 ? "● Healthy" : "● Init"}
                  </span>
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">Projection Lag:</span>
                <span className={`font-bold ${diagnostics.projectionLag > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {diagnostics.projectionLag} events
                </span>
              </li>
            </ul>
          </div>

          {/* 3. Live Event Inspector */}
          <div className="bg-slate-900 border border-slate-800 rounded p-4 shadow-lg text-xs col-span-1">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2 mb-3 uppercase tracking-wider">
              Live Event Inspector
            </h3>
            {timeline.length === 0 ? (
              <p className="text-slate-500 text-center py-6">No events to inspect.</p>
            ) : (
              <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                {timeline.map((evt, idx) => (
                  <div key={evt.eventId || idx} className="bg-slate-950 border border-slate-850 p-2 rounded text-[10px]">
                    <div className="flex justify-between text-slate-400 font-bold mb-1 border-b border-slate-800 pb-1">
                      <span>Event #{evt.details?.expectedVersion || idx + 1}</span>
                      <span>{new Date(evt.occurredAt).toLocaleTimeString()}</span>
                    </div>
                    <ul className="space-y-1 text-slate-300">
                      <li>Type: <span className="text-white font-semibold">{evt.eventType}</span></li>
                      <li>Correlation: <span className="text-white font-semibold block truncate" title={evt.correlationId}>{evt.correlationId}</span></li>
                      <li>Provider: <span className="text-white font-semibold">MockProvider</span></li>
                      <li>Latency: <span className="text-emerald-400 font-semibold">{diagnostics.latencyMs}ms</span></li>
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

        </section>
      )}
    </div>
  );
}
export default MatchCenterDashboard;
