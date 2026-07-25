import React, { useState } from 'react';

export default function AdminOperationsPanel() {
  const [copied, setCopied] = useState(false);

  const handleCopyIp = () => {
    navigator.clipboard.writeText('connect 185.242.115.42:27015; password pixel_cup_gf');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const refereeLogs = [
    { time: '20:10', type: 'WARMUP', text: 'Knife round completed. Team DONSTU won side selection (CT).' },
    { time: '20:42', type: 'MAP_END', text: 'Map 1 (Ancient) verified & signed off by Referee Alex.' },
    { time: '21:04', type: 'PAUSE', text: 'Tactical Timeout called by Basement Bobs (Timeout 1/2).' },
    { time: '21:35', type: 'PAUSE', text: 'Technical Pause called due to player ping spike on Dust2.' },
    { time: '21:38', type: 'RESUME', text: 'Server match resumed by Referee Alex.' },
  ];

  return (
    <div className="bg-[#0a0d16]/60 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-md font-mono space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-widest">
            <span>🛡️</span> REFEREE & ADMIN OPERATIONAL DASHBOARD
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Match Server RCON, Pause Audit Logs & Technical Status</p>
        </div>
        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/40 px-3 py-1 rounded">
          🟢 SERVER HEALTHY (128 TICK)
        </span>
      </div>

      {/* Admin Server Connection Card */}
      <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[9px] text-slate-550 block mb-1 uppercase font-bold">GAME SERVER CONNECTION (RCON AUTHORIZED)</span>
          <code className="text-xs text-indigo-400 font-bold">connect 185.242.115.42:27015; password pixel_cup_gf</code>
        </div>
        <button
          onClick={handleCopyIp}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
        >
          {copied ? '✓ COPIED IP' : 'COPY CONNECT STRING'}
        </button>
      </div>

      {/* Referee Pause & Violation Audit Log */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          REFEREE PAUSE & INTERVENTION AUDIT LOG
        </h4>
        <div className="space-y-2">
          {refereeLogs.map((log, idx) => (
            <div key={idx} className="bg-slate-950/40 border border-slate-900 p-3 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500 font-bold">{log.time}</span>
                <span className="text-[9px] font-black bg-slate-900 border border-slate-800 text-amber-400 px-2 py-0.5 rounded">
                  {log.type}
                </span>
                <span className="text-slate-300">{log.text}</span>
              </div>
              <span className="text-[9px] text-slate-600 font-bold">VERIFIED</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
