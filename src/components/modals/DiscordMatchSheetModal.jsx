import React, { useState } from 'react';
import { X, Copy, Check, MessageSquare, Shield, FileText, Send, Tv, Trophy } from 'lucide-react';
import { generateDiscordMatchSheet } from '../../utils/discordAnnouncementGenerator';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

export const DiscordMatchSheetModal = ({ match, tournament, isOpen, onClose }) => {
  useKeyboardShortcut('Escape', onClose);
  const [templateType, setTemplateType] = useState('PRE_MATCH');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !match) return null;

  const matchSheetText = generateDiscordMatchSheet(match, templateType, tournament || {});

  const handleCopy = () => {
    navigator.clipboard.writeText(matchSheetText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const templates = [
    { id: 'PRE_MATCH', label: '1. Pre-Match Schedule', icon: CalendarIcon },
    { id: 'CAPTAIN_READY', label: '2. Captain Lobby & Server', icon: Shield },
    { id: 'LIVE_BROADCAST', label: '3. Stream Broadcast Alert', icon: Tv },
    { id: 'POST_MATCH', label: '4. Post-Match Result', icon: Trophy },
  ];

  function CalendarIcon(props) {
    return <FileText {...props} />;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 font-mono">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-[#080b18] border border-indigo-500/40 rounded-2xl flex flex-col overflow-hidden shadow-[0_0_60px_rgba(99,102,241,0.25)] animate-in zoom-in-95 duration-200 z-10 p-6 space-y-5">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider font-heading">
                DISCORD MATCH SHEET GENERATOR
              </h3>
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">
                MATCH #{match.id || 'N/A'} • {match.team1?.name || 'Team 1'} vs {match.team2?.name || 'Team 2'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Template Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => setTemplateType(t.id)}
              className={`p-2.5 rounded-lg border text-left font-bold transition-all ${
                templateType === t.id
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                  : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              <div className="text-[10px] uppercase truncate">{t.label}</div>
            </button>
          ))}
        </div>

        {/* Generated Code Area */}
        <div className="relative bg-black/80 border border-white/10 rounded-xl p-4 overflow-x-auto max-h-72 font-mono text-xs text-emerald-400 selection:bg-indigo-500/30">
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] px-3 py-1.5 rounded flex items-center gap-1.5 transition shadow-lg cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'COPIED TO CLIPBOARD!' : 'COPY MATCH SHEET'}</span>
          </button>

          <pre className="whitespace-pre-wrap leading-relaxed pr-32 font-mono">
            {matchSheetText}
          </pre>
        </div>

        {/* Help Tip */}
        <div className="text-[10px] text-zinc-500 flex items-center justify-between border-t border-slate-800 pt-3">
          <span>💡 One-click copy formatted Discord markdown directly into official staff & team channels.</span>
          <span className="text-indigo-400 font-bold">OPERATIONS TOOLING</span>
        </div>

      </div>
    </div>
  );
};
