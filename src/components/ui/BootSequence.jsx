import React, { useState, useEffect } from 'react';

export function BootSequence({ onComplete }) {
  const [lines, setLines] = useState([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const sequence = [
      "INIT_CORE_SYSTEMS...",
      "ESTABLISHING_SECURE_UPLINK...",
      "BYPASSING_MAINFRAME...",
      "DECRYPTING_TOURNAMENT_DATA...",
      "LOADING_ASSETS...",
      "SYSTEM_ONLINE"
    ];

    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < sequence.length) {
        setLines(prev => [...prev, sequence[currentLine]]);
        setProgress(((currentLine + 1) / sequence.length) * 100);
        currentLine++;
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 500);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center font-mono">
      <div className="w-full max-w-lg p-8">
        <div className="mb-8 h-48 overflow-hidden flex flex-col justify-end">
          {lines.map((line, i) => (
            <div key={i} className="text-neon-cyan text-sm tracking-widest uppercase animate-in slide-in-from-bottom-2 duration-200">
              <span className="text-zinc-500 mr-2">{'>'}</span> {line}
            </div>
          ))}
          {progress < 100 && (
            <div className="text-neon-pink text-sm tracking-widest uppercase animate-pulse mt-1">
              <span className="text-zinc-500 mr-2">{'>'}</span> _
            </div>
          )}
        </div>
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-neon-cyan transition-all duration-200 shadow-[0_0_10px_rgba(0,240,255,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-4 text-center text-[10px] text-zinc-500 tracking-[0.3em] font-bold">
          PIXEL PALACE OS v3.0
        </div>
      </div>
    </div>
  );
}
