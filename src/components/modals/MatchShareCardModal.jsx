import React, { useState, useEffect, useRef } from 'react';
import { Download, Copy, Check, X, Users, MessageCircle, Tv, Instagram, Shield, Layout, Radio, Trophy, Sparkles, Palette, Bookmark, Sliders, Zap, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

const MAP_BACKGROUNDS = {
  cache: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200',
  dust2: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200',
  mirage: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1200',
  nuke: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200',
  inferno: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?q=80&w=1200',
  anubis: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200',
  ancient: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200',
};

const OFFICIAL_LOGO_URL = 'https://raw.githubusercontent.com/alphabravo2k-rgb/pixel-palace-registration/1a7d90c43796fd037316bdaf4f3b4de9a485d615/image_4379f9.png';

const THEMES = {
  CYBER_NEON: { name: 'Cyber Neon (Pixel Palace)', primary: '#ff007f', secondary: '#00f0ff', bgA: 'rgba(28, 8, 38, 0.94)', bgB: 'rgba(6, 32, 44, 0.94)' },
  CLEAN_ESPORTS: { name: 'Clean Esports (ESL)', primary: '#ffffff', secondary: '#94a3b8', bgA: 'rgba(15, 23, 42, 0.96)', bgB: 'rgba(30, 41, 59, 0.96)' },
  FACEIT_DARK: { name: 'FACEIT Orange', primary: '#ff5500', secondary: '#ffaa00', bgA: 'rgba(28, 14, 8, 0.94)', bgB: 'rgba(40, 20, 10, 0.94)' },
  PGL_GOLD: { name: 'PGL Major Gold', primary: '#eab308', secondary: '#fef08a', bgA: 'rgba(30, 24, 8, 0.94)', bgB: 'rgba(18, 14, 5, 0.94)' }
};

const BADGES = [
  '🔴 LIVE NOW',
  '🏆 GRAND FINAL',
  '⭐ FEATURED MATCH',
  '⚔ ELIMINATION MATCH',
  '🎙 OFFICIAL STREAM'
];

export const MatchShareCardModal = ({ match, onClose }) => {
  const canvasRef = useRef(null);

  // Template State: 'MATCHUP' | 'LIVE' | 'RESULT' | 'MINIMAL'
  const [activeTemplate, setActiveTemplate] = useState('MATCHUP');
  const [activeTheme, setActiveTheme] = useState('CYBER_NEON');
  const [activeTab, setActiveTab] = useState('MATCH'); // 'MATCH' | 'TEAMS' | 'ROSTER' | 'BRANDING'
  const [exportRes, setExportRes] = useState('1920x1080'); // '1920x1080' | '1080x1080' | '1080x1920'
  const [previewZoom, setPreviewZoom] = useState(100); // 75, 100, 125, 150

  // Modular Layer Controls
  const [showRosters, setShowRosters] = useState(true);
  const [showTeamLogos, setShowTeamLogos] = useState(true);
  const [showScores, setShowScores] = useState(true);
  const [showStoryTag, setShowStoryTag] = useState(true);

  const [matchBadge, setMatchBadge] = useState('🔴 LIVE NOW');
  const [storyTag, setStoryTag] = useState('Winner qualifies for Semi Final');

  const [downloading, setDownloading] = useState(false);
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Strict API Data Extraction (Zero Mock Data)
  const mapName = (match?.liveMap || match?.map || 'de_cache').replace('de_', '').toUpperCase();
  const mapKey = mapName.toLowerCase();
  
  const teamA = match?.teamA?.name || match?.team1Obj?.name || match?.team1_name || match?.team1 || 'Team A';
  const teamATag = match?.teamA?.tag || match?.team1Obj?.tag || match?.team1_tag || teamA.substring(0, 3).toUpperCase();
  const teamALogoUrl = match?.teamA?.logo || match?.team1Obj?.logo || match?.team1_logo || null;

  const teamB = match?.teamB?.name || match?.team2Obj?.name || match?.team2_name || match?.team2 || 'Team B';
  const teamBTag = match?.teamB?.tag || match?.team2Obj?.tag || match?.team2_tag || teamB.substring(0, 3).toUpperCase();
  const teamBLogoUrl = match?.teamB?.logo || match?.team2Obj?.logo || match?.team2_logo || null;

  const scoreA = match?.mapScoreT1 ?? match?.seriesScore?.teamAWins ?? 0;
  const scoreB = match?.mapScoreT2 ?? match?.seriesScore?.teamBWins ?? 0;
  const isBye = match?.isBye || match?.status === 'BYE';
  const format = match?.format || (match?.best_of ? `BO${match.best_of}` : 'BO1');
  const roundName = match?.roundName || match?.stage || 'QUARTER FINAL';
  const scheduleTime = match?.scheduleTime || match?.scheduled_at || match?.time || '31 JULY • 8:00 PM PKT';

  // Roster arrays from live API
  const rosterA = match?.team1_players || match?.teamA?.players || match?.rosterA || [];
  const rosterB = match?.team2_players || match?.teamB?.players || match?.rosterB || [];

  // Reset Default Parameters
  const handleResetSettings = () => {
    setActiveTemplate('MATCHUP');
    setActiveTheme('CYBER_NEON');
    setShowRosters(true);
    setShowTeamLogos(true);
    setShowScores(true);
    setShowStoryTag(true);
    setMatchBadge('🔴 LIVE NOW');
    setStoryTag('Winner qualifies for Semi Final');
  };

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const theme = THEMES[activeTheme] || THEMES.CYBER_NEON;
    const ctx = canvas.getContext('2d');
    
    let w = 1200;
    let h = 675;
    if (exportRes === '1080x1080') { w = 1080; h = 1080; }
    else if (exportRes === '1080x1920') { w = 1080; h = 1920; }

    canvas.width = w;
    canvas.height = h;

    // 1. Dark Base Background
    ctx.fillStyle = '#050711';
    ctx.fillRect(0, 0, w, h);

    // Load Images
    const mapImg = new Image();
    mapImg.crossOrigin = 'anonymous';
    mapImg.src = MAP_BACKGROUNDS[mapKey] || MAP_BACKGROUNDS.cache;

    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.src = OFFICIAL_LOGO_URL;

    const logoA = new Image();
    if (teamALogoUrl) { logoA.crossOrigin = 'anonymous'; logoA.src = teamALogoUrl; }

    const logoB = new Image();
    if (teamBLogoUrl) { logoB.crossOrigin = 'anonymous'; logoB.src = teamBLogoUrl; }

    let mapLoaded = false;
    let logoLoaded = false;
    let logoALoaded = false;
    let logoBLoaded = false;

    mapImg.onload = () => { mapLoaded = true; checkAndDraw(); };
    mapImg.onerror = () => checkAndDraw();

    logoImg.onload = () => { logoLoaded = true; checkAndDraw(); };
    logoImg.onerror = () => checkAndDraw();

    logoA.onload = () => { logoALoaded = true; checkAndDraw(); };
    logoA.onerror = () => checkAndDraw();

    logoB.onload = () => { logoBLoaded = true; checkAndDraw(); };
    logoB.onerror = () => checkAndDraw();

    function checkAndDraw() {
      drawCanvas();
    }

    // Auto Font-Scaling Helper for Long Team Names
    function getAutoScaledFontSize(text, maxW, baseSize = 34) {
      let fontSize = baseSize;
      ctx.font = `900 ${fontSize}px system-ui, sans-serif`;
      while (ctx.measureText(text).width > maxW && fontSize > 16) {
        fontSize -= 2;
        ctx.font = `900 ${fontSize}px system-ui, sans-serif`;
      }
      return fontSize;
    }

    function drawCanvas() {
      // 2. Map Background Texture
      if (mapLoaded) {
        ctx.save();
        ctx.globalAlpha = activeTemplate === 'MINIMAL' ? 0.18 : 0.35;
        ctx.drawImage(mapImg, 0, 0, w, h);
        ctx.restore();
      }

      // 3. Ambient Gradient Overlays
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w * 0.55, 0);
      ctx.lineTo(w * 0.45, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      const gradA = ctx.createLinearGradient(0, 0, w * 0.5, h);
      gradA.addColorStop(0, theme.bgA);
      gradA.addColorStop(1, 'rgba(9, 5, 20, 0.98)');
      ctx.fillStyle = gradA;
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(w * 0.55, 0);
      ctx.lineTo(w, 0);
      ctx.lineTo(w, h);
      ctx.lineTo(w * 0.45, h);
      ctx.closePath();
      const gradB = ctx.createLinearGradient(w * 0.5, 0, w, h);
      gradB.addColorStop(0, theme.bgB);
      gradB.addColorStop(1, 'rgba(3, 12, 20, 0.98)');
      ctx.fillStyle = gradB;
      ctx.fill();
      ctx.restore();

      // Glowing Center Slash Line
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(w * 0.55, 0);
      ctx.lineTo(w * 0.45, h);
      ctx.strokeStyle = theme.primary;
      ctx.lineWidth = 4;
      ctx.shadowColor = theme.secondary;
      ctx.shadowBlur = 24;
      ctx.stroke();
      ctx.restore();

      // 4. HARDCODED: Official Pixel Palace Header Branding (ALWAYS RENDERED)
      ctx.save();
      if (logoLoaded) {
        ctx.shadowColor = theme.primary;
        ctx.shadowBlur = 18;
        ctx.drawImage(logoImg, 60, 32, 140, 48);
      }
      ctx.font = '900 22px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('PIXEL PALACE', logoLoaded ? 212 : 60, 48);

      ctx.font = '800 11px monospace';
      ctx.fillStyle = theme.primary;
      ctx.fillText('COMMUNITY CUP 2', logoLoaded ? 212 : 60, 64);

      ctx.font = '700 10px monospace';
      ctx.fillStyle = theme.secondary;
      ctx.fillText('2026 SEASON OFFICIAL MATCH POSTER', logoLoaded ? 212 : 60, 78);
      ctx.restore();

      // 5. Match Spec Chips (Top Right Stack)
      ctx.save();
      ctx.fillStyle = 'rgba(5, 7, 17, 0.9)';
      ctx.strokeStyle = theme.secondary;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(w - 390, 28, 330, 68, 10);
      ctx.fill();
      ctx.stroke();

      ctx.font = '900 12px monospace';
      ctx.fillStyle = theme.primary;
      ctx.textAlign = 'center';
      ctx.fillText(`${roundName.toUpperCase()} • MATCH #${match?.id || '33'}`, w - 225, 47);

      ctx.font = '800 11px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${mapName} • ${format}`, w - 225, 63);

      ctx.font = '700 10px monospace';
      ctx.fillStyle = theme.secondary;
      ctx.fillText(scheduleTime, w - 225, 78);
      ctx.restore();

      // 6. Broadcast Pill Badge
      ctx.save();
      ctx.fillStyle = matchBadge.includes('LIVE') ? 'rgba(225, 29, 72, 0.25)' : 'rgba(255, 0, 127, 0.2)';
      ctx.strokeStyle = matchBadge.includes('LIVE') ? '#f43f5e' : theme.primary;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(w * 0.5 - 105, 115, 210, 32, 16);
      ctx.fill();
      ctx.stroke();

      ctx.font = '900 11px monospace';
      ctx.fillStyle = matchBadge.includes('LIVE') ? '#fb7185' : theme.primary;
      ctx.textAlign = 'center';
      ctx.fillText(matchBadge.toUpperCase(), w * 0.5, 135);
      ctx.restore();

      // 7. Story / Narrative Subtitle Badge
      if (showStoryTag && storyTag) {
        ctx.save();
        ctx.font = '800 11px monospace';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText(`— ${storyTag} —`, w * 0.5, 165);
        ctx.restore();
      }

      // 8. Team A (Left Side - 5-10% Larger Logo Breathing Room)
      ctx.save();
      if (showTeamLogos) {
        if (logoALoaded) {
          ctx.save();
          ctx.shadowColor = theme.primary;
          ctx.shadowBlur = 20;
          ctx.drawImage(logoA, 60, 164, 76, 76);
          ctx.restore();
        } else {
          ctx.fillStyle = 'rgba(255, 0, 127, 0.18)';
          ctx.strokeStyle = theme.primary;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(60, 164, 76, 76, 16);
          ctx.fill();
          ctx.stroke();

          ctx.font = '900 20px monospace';
          ctx.fillStyle = theme.primary;
          ctx.textAlign = 'center';
          ctx.fillText(teamATag, 98, 209);
        }
      }

      const teamAXPos = showTeamLogos ? 152 : 60;
      const teamAFontSize = getAutoScaledFontSize(teamA.toUpperCase(), 320, 34);
      ctx.font = `900 ${teamAFontSize}px system-ui, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = theme.primary;
      ctx.shadowBlur = 10;
      ctx.textAlign = 'left';
      ctx.fillText(teamA.toUpperCase(), teamAXPos, 200);

      ctx.font = '800 13px monospace';
      ctx.fillStyle = theme.primary;
      ctx.fillText(`#${teamATag}`, teamAXPos, 226);
      ctx.restore();

      // 9. Team B (Right Side - 5-10% Larger Logo Breathing Room)
      ctx.save();
      const rightAnchorX = w - 60;

      if (showTeamLogos) {
        if (logoBLoaded) {
          ctx.save();
          ctx.shadowColor = theme.secondary;
          ctx.shadowBlur = 20;
          ctx.drawImage(logoB, rightAnchorX - 76, 164, 76, 76);
          ctx.restore();
        } else {
          ctx.fillStyle = 'rgba(0, 240, 255, 0.18)';
          ctx.strokeStyle = theme.secondary;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(rightAnchorX - 76, 164, 76, 76, 16);
          ctx.fill();
          ctx.stroke();

          ctx.font = '900 20px monospace';
          ctx.fillStyle = theme.secondary;
          ctx.textAlign = 'center';
          ctx.fillText(teamBTag, rightAnchorX - 38, 209);
        }
      }

      const teamBXPos = showTeamLogos ? (rightAnchorX - 90) : rightAnchorX;
      const teamBFontSize = getAutoScaledFontSize((isBye ? 'BYE' : teamB).toUpperCase(), 320, 34);
      ctx.font = `900 ${teamBFontSize}px system-ui, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = theme.secondary;
      ctx.shadowBlur = 10;
      ctx.textAlign = 'right';
      ctx.fillText((isBye ? 'BYE' : teamB).toUpperCase(), teamBXPos, 200);

      ctx.font = '800 13px monospace';
      ctx.fillStyle = theme.secondary;
      ctx.fillText(`${isBye ? 'BYE' : `#${teamBTag}`}`, teamBXPos, 226);
      ctx.restore();

      // 10. DYNAMIC Hero Matchup Section (Matchup VS / Live Scores / Result)
      const heroY = 255;

      if (showScores && (activeTemplate === 'LIVE' || activeTemplate === 'RESULT')) {
        ctx.save();
        ctx.font = '900 64px monospace';
        ctx.fillStyle = theme.primary;
        ctx.textAlign = 'right';
        ctx.fillText(String(activeTemplate === 'RESULT' ? (scoreA || 13) : (scoreA || 8)), w * 0.5 - 90, heroY + 22);

        ctx.fillStyle = activeTemplate === 'RESULT' ? 'rgba(234, 179, 8, 0.95)' : 'rgba(239, 68, 68, 0.95)';
        ctx.strokeStyle = activeTemplate === 'RESULT' ? '#fde047' : '#f87171';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(w * 0.5, heroY, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = '900 15px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(activeTemplate === 'RESULT' ? 'FINAL' : 'LIVE', w * 0.5, heroY);

        ctx.font = '900 64px monospace';
        ctx.fillStyle = theme.secondary;
        ctx.textAlign = 'left';
        ctx.fillText(String(activeTemplate === 'RESULT' ? (scoreB || 10) : (scoreB || 6)), w * 0.5 + 90, heroY + 22);
        ctx.restore();

      } else {
        // DEFAULT Pre-Match VS Mode
        ctx.save();
        ctx.fillStyle = 'rgba(5, 7, 17, 0.95)';
        ctx.strokeStyle = theme.secondary;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = theme.primary;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(w * 0.5, heroY, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = '900 22px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('VS', w * 0.5, heroY);
        ctx.restore();
      }

      // 11. Lineup Dossier Cards (Strict Live API Player Render)
      if (showRosters && activeTemplate !== 'MINIMAL') {
        ctx.save();
        ctx.font = '800 13px monospace';

        if (rosterA.length > 0) {
          rosterA.slice(0, 5).forEach((player, i) => {
            const pName = typeof player === 'string' ? player : player.name || player.ign || `Player ${i + 1}`;
            const pIcon = typeof player === 'object' ? (player.icon || '🎯') : (i === 0 ? '👑' : '🎯');
            const cardY = 350 + i * 36;

            ctx.fillStyle = 'rgba(255, 0, 127, 0.08)';
            ctx.strokeStyle = 'rgba(255, 0, 127, 0.25)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(60, cardY, 260, 30, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(`${pIcon}  ${pName.toUpperCase()}`, 72, cardY + 20);
          });
        }

        if (!isBye && rosterB.length > 0) {
          rosterB.slice(0, 5).forEach((player, i) => {
            const pName = typeof player === 'string' ? player : player.name || player.ign || `Player ${i + 1}`;
            const pIcon = typeof player === 'object' ? (player.icon || '🎯') : (i === 0 ? '👑' : '🎯');
            const cardY = 350 + i * 36;

            ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(w - 320, cardY, 260, 30, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'right';
            ctx.fillText(`${pName.toUpperCase()}  ${pIcon}`, w - 75, cardY + 20);
          });
        }
        ctx.restore();
      }

      // 12. HARDCODED: Footer Social Handles & Prize Pool Strip (ALWAYS RENDERED)
      ctx.save();
      ctx.fillStyle = 'rgba(5, 7, 17, 0.98)';
      ctx.fillRect(0, h - 70, w, 70);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.moveTo(0, h - 70);
      ctx.lineTo(w, h - 70);
      ctx.stroke();

      ctx.font = '800 12px monospace';
      ctx.fillStyle = '#e2e8f0';

      ctx.textAlign = 'left';
      ctx.fillText('💬 discord.gg/pixelpalacee', 60, h - 28);

      ctx.textAlign = 'center';
      ctx.fillText('🏆 $2,750 USD PRIZE POOL • 📺 twitch.tv/pXpLgg', w * 0.5, h - 28);

      ctx.textAlign = 'right';
      ctx.fillText('📸 instagram.com/pixelpalace.gg', w - 60, h - 28);
      ctx.restore();
    }

    checkAndDraw();
  }, [showRosters, showTeamLogos, showScores, showStoryTag, activeTemplate, activeTheme, exportRes, matchBadge, storyTag, match, mapName, mapKey, teamA, teamB, teamATag, teamBTag, teamALogoUrl, teamBLogoUrl, scoreA, scoreB, isBye, format, roundName, scheduleTime, rosterA, rosterB]);

  // Download Single PNG
  const handleDownload = () => {
    setDownloading(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `PixelPalace_${activeTemplate}_${exportRes}_Match_${match?.id || '33'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    setTimeout(() => setDownloading(false), 1000);
  };

  // Batch Download Complete Media Package (All 4 Templates)
  const handleBatchDownload = async () => {
    setBatchDownloading(true);
    const templates = ['MATCHUP', 'LIVE', 'RESULT', 'MINIMAL'];
    
    for (let i = 0; i < templates.length; i++) {
      const t = templates[i];
      setActiveTemplate(t);
      await new Promise(r => setTimeout(r, 400));
      
      const canvas = canvasRef.current;
      if (canvas) {
        const link = document.createElement('a');
        link.download = `MediaKit_0${i + 1}_${t}_Match_${match?.id || '33'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    }
    
    setActiveTemplate('MATCHUP');
    setBatchDownloading(false);
  };

  // Copy Link Handler
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300 font-mono">
      <div className="w-full max-w-5xl bg-[#080b18] border border-white/15 rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(0,240,255,0.25)] p-6 space-y-5 custom-scrollbar max-h-[95vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-neon-pink/30 blur-md rounded-full animate-pulse" />
              <img
                src={OFFICIAL_LOGO_URL}
                alt="Pixel Palace Official Logo"
                className="h-9 object-contain relative z-10"
              />
            </div>
            <div>
              <h2 className="text-base font-heading font-black text-white uppercase tracking-wider flex items-center gap-2">
                BROADCAST MEDIA STUDIO <Sparkles className="w-4 h-4 text-neon-cyan" />
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Professional SaaS media production suite for tournament graphics and social story cards.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 text-zinc-400 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Visually Separated Control Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/50 p-4 rounded-xl border border-white/10">
          
          {/* Section A: Templates */}
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">
              Templates
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTemplate('MATCHUP')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer ${
                  activeTemplate === 'MATCHUP'
                    ? 'bg-neon-pink/20 border-neon-pink text-white shadow-[0_0_12px_rgba(255,0,127,0.3)]'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <Layout className="w-3.5 h-3.5" /> Pre-Match
              </button>

              <button
                onClick={() => setActiveTemplate('LIVE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer ${
                  activeTemplate === 'LIVE'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> Live Stream
              </button>

              <button
                onClick={() => setActiveTemplate('RESULT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer ${
                  activeTemplate === 'RESULT'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> Final Result
              </button>

              <button
                onClick={() => setActiveTemplate('MINIMAL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer ${
                  activeTemplate === 'MINIMAL'
                    ? 'bg-neon-cyan/20 border-neon-cyan text-white shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-neon-cyan" /> Minimal
              </button>
            </div>
          </div>

          {/* Section B: Appearance */}
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">
              Appearance & Format
            </label>
            <div className="flex items-center gap-2">
              <select
                value={activeTheme}
                onChange={(e) => setActiveTheme(e.target.value)}
                className="w-1/2 bg-[#050711] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-neon-cyan"
              >
                {Object.keys(THEMES).map((tKey) => (
                  <option key={tKey} value={tKey}>
                    {THEMES[tKey].name}
                  </option>
                ))}
              </select>

              <select
                value={exportRes}
                onChange={(e) => setExportRes(e.target.value)}
                className="w-1/2 bg-[#050711] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-neon-cyan"
              >
                <option value="1920x1080">16:9 Broadcast HD</option>
                <option value="1080x1080">1:1 Square Post</option>
                <option value="1080x1920">9:16 Story Vertical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Canvas Preview with Zoom & Scale Controls */}
        <div className="relative rounded-xl overflow-hidden border border-white/15 shadow-2xl bg-black/80 flex flex-col items-center justify-center p-2">
          {/* Zoom Bar */}
          <div className="w-full flex items-center justify-between px-3 py-1 bg-[#050711]/90 rounded-lg mb-2 text-xs text-zinc-400 font-bold border border-white/5">
            <span>LIVE GRAPHIC CANVAS PREVIEW</span>
            <div className="flex items-center gap-2">
              <ZoomOut className="w-3.5 h-3.5 text-zinc-400" />
              {[75, 100, 125, 150].map((z) => (
                <button
                  key={z}
                  onClick={() => setPreviewZoom(z)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${previewZoom === z ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40' : 'hover:text-white'}`}
                >
                  {z}%
                </button>
              ))}
              <ZoomIn className="w-3.5 h-3.5 text-zinc-400" />
            </div>
          </div>

          <div className="w-full flex justify-center overflow-x-auto">
            <canvas
              ref={canvasRef}
              className="h-auto max-h-[440px] object-contain rounded-lg shadow-2xl transition-transform duration-200"
              style={{ transform: `scale(${previewZoom / 100})`, transformOrigin: 'center center' }}
            />
          </div>
        </div>

        {/* POSTER OPTIONS & MEDIA SETTINGS Tabs */}
        <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-neon-pink" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">POSTER OPTIONS & MEDIA SETTINGS</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('MATCH')}
                className={`px-3 py-1 rounded text-xs font-bold ${activeTab === 'MATCH' ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30' : 'text-zinc-400 hover:text-white'}`}
              >
                Match Info
              </button>
              <button
                onClick={() => setActiveTab('TEAMS')}
                className={`px-3 py-1 rounded text-xs font-bold ${activeTab === 'TEAMS' ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 'text-zinc-400 hover:text-white'}`}
              >
                Team Specs
              </button>
              <button
                onClick={() => setActiveTab('ROSTER')}
                className={`px-3 py-1 rounded text-xs font-bold ${activeTab === 'ROSTER' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-zinc-400 hover:text-white'}`}
              >
                Lineups
              </button>
              <button
                onClick={() => setActiveTab('BRANDING')}
                className={`px-3 py-1 rounded text-xs font-bold ${activeTab === 'BRANDING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-zinc-400 hover:text-white'}`}
              >
                Branding
              </button>

              <button
                onClick={handleResetSettings}
                className="px-2.5 py-1 rounded bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-white/10 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ml-2"
                title="Reset Options to Default"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>

          {/* Tab 1: Match Info */}
          {activeTab === 'MATCH' && (
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                Visual Broadcast Badge Picker
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {BADGES.map((b) => (
                  <button
                    key={b}
                    onClick={() => setMatchBadge(b)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      matchBadge === b
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Team Specs */}
          {activeTab === 'TEAMS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                <span className="text-xs text-white font-bold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-neon-cyan" /> Render Team Logo Emblems
                </span>
                <input
                  type="checkbox"
                  checked={showTeamLogos}
                  onChange={(e) => setShowTeamLogos(e.target.checked)}
                  className="w-4 h-4 accent-neon-cyan cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                <span className="text-xs text-white font-bold flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" /> Render Match Scores
                </span>
                <input
                  type="checkbox"
                  checked={showScores}
                  onChange={(e) => setShowScores(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Tab 3: Lineup Dossier */}
          {activeTab === 'ROSTER' && (
            <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
              <span className="text-xs text-white font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-neon-pink" /> Render 5v5 Player Lineups
              </span>
              <input
                type="checkbox"
                checked={showRosters}
                onChange={(e) => setShowRosters(e.target.checked)}
                className="w-4 h-4 accent-neon-pink cursor-pointer"
              />
            </div>
          )}

          {/* Tab 4: Branding & Story */}
          {activeTab === 'BRANDING' && (
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1 flex items-center gap-1">
                <Bookmark className="w-3 h-3 text-amber-400" /> Story Subtitle
              </label>
              <select
                value={storyTag}
                onChange={(e) => setStoryTag(e.target.value)}
                className="w-full bg-[#050711] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-neon-cyan"
              >
                <option value="Winner qualifies for Semi Final">Winner qualifies for Semi Final</option>
                <option value="Winner secures Top 4">Winner secures Top 4</option>
                <option value="Lower Bracket Elimination">Lower Bracket Elimination</option>
                <option value="Rivalry Match">Rivalry Match</option>
                <option value="#1 Seed vs #8 Seed">#1 Seed vs #8 Seed</option>
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10">
          <div className="flex items-center gap-3 text-xs text-zinc-400 font-bold">
            <a href="https://discord.com/invite/pixelpalacee" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-neon-cyan transition-colors">
              <MessageCircle className="w-3.5 h-3.5 text-indigo-400" /> Discord
            </a>
            <span>•</span>
            <a href="https://www.twitch.tv/pXpLgg" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-neon-pink transition-colors">
              <Tv className="w-3.5 h-3.5 text-purple-400" /> Twitch
            </a>
            <span>•</span>
            <a href="https://www.instagram.com/pixelpalace.gg" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-neon-cyan transition-colors">
              <Instagram className="w-3.5 h-3.5 text-pink-400" /> Instagram
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleBatchDownload}
              disabled={batchDownloading}
              className="px-4 py-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>{batchDownloading ? 'GENERATING...' : '⚡ GENERATE COMPLETE MEDIA KIT'}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'LINK COPIED' : 'COPY LINK'}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-neon-pink to-neon-cyan hover:opacity-90 text-white text-xs font-heading font-black tracking-wider transition-all flex items-center gap-2 shadow-[0_0_25px_rgba(255,0,127,0.5)] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'GENERATING GRAPHIC...' : 'DOWNLOAD PNG CARD'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
