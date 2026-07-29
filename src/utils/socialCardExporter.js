/**
 * AAA Broadcast-Grade Social Match Graphic Exporter (1200x630 Canvas PNG)
 * Renders BLAST Premier / ESL Pro League Split-Screen Match Banners
 */

export function generateSocialMatchCard(match) {
  const teamA = match.teamA?.name || match.team1Obj?.name || match.team1_name || match.team1 || 'Team A';
  const teamB = match.teamB?.name || match.team2Obj?.name || match.team2_name || match.team2 || 'Team B';
  const teamATag = match.teamA?.tag || match.team1Obj?.tag || teamA.substring(0, 3).toUpperCase();
  const teamBTag = match.teamB?.tag || match.team2Obj?.tag || teamB.substring(0, 3).toUpperCase();
  
  const teamALogo = match.teamA?.logo || match.team1Obj?.logo || null;
  const teamBLogo = match.teamB?.logo || match.team2Obj?.logo || null;

  const round = match.round || 'Round of 32';
  const format = match.format || `BO${match.best_of || 1}`;
  const isBye = match.status === 'BYE' || match.isBye;
  const isFinished = match.status === 'Completed' || match.status === 'COMPLETED';
  const isLive = match.status === 'Live' || match.status === 'LIVE';

  const scoreA = match.seriesScore?.teamAWins ?? match.score_team1 ?? 0;
  const scoreB = match.seriesScore?.teamBWins ?? match.score_team2 ?? 0;

  // Create 1200x630 Canvas
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');

  const imgA = new Image();
  const imgB = new Image();
  let loadedCount = 0;
  const totalImages = (teamALogo ? 1 : 0) + (teamBLogo ? 1 : 0);

  const drawCanvas = () => {
    // 1. BASE BACKGROUND: Deep Obsidian
    ctx.fillStyle = '#050711';
    ctx.fillRect(0, 0, 1200, 630);

    // 2. LEFT SIDE (Team A - Deep Royal Violet)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(670, 0);
    ctx.lineTo(530, 630);
    ctx.lineTo(0, 630);
    ctx.closePath();
    const gradA = ctx.createLinearGradient(0, 0, 600, 630);
    gradA.addColorStop(0, '#1e1035');
    gradA.addColorStop(1, '#0d071a');
    ctx.fillStyle = gradA;
    ctx.fill();

    // Subtle Grid overlay A
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 650; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - 100, 630); ctx.stroke();
    }
    ctx.restore();

    // 3. RIGHT SIDE (Team B - Deep Cyber Cyan)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(670, 0);
    ctx.lineTo(1200, 0);
    ctx.lineTo(1200, 630);
    ctx.lineTo(530, 630);
    ctx.closePath();
    const gradB = ctx.createLinearGradient(600, 0, 1200, 630);
    gradB.addColorStop(0, '#062635');
    gradB.addColorStop(1, '#03121a');
    ctx.fillStyle = gradB;
    ctx.fill();

    // Subtle Grid overlay B
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 600; x < 1300; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - 100, 630); ctx.stroke();
    }
    ctx.restore();

    // 4. DIAGONAL DIVISION SLASH LINE (Glowing Neon)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(670, 0);
    ctx.lineTo(530, 630);
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#818cf8';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.restore();

    // 5. LARGE BACKGROUND WATERMARK TEXT
    ctx.save();
    ctx.translate(600, 315);
    ctx.rotate(-Math.PI / 16);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.font = 'black 120px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PIXEL PALACE OS', 0, 0);
    ctx.restore();

    // 6. OUTER NEON BORDER
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, 1176, 606);

    // 7. HEADER BAR (Tournament Banner, Prize Pool & Stage)
    ctx.fillStyle = 'rgba(9, 12, 25, 0.85)';
    ctx.fillRect(12, 12, 1176, 64);
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, 1176, 64);

    // Left Header Badge: Prize Pool
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'black 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('🏆 COMMUNITY CUP 2', 40, 50);

    // Center Header Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'black 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PIXEL PALACE ESPORTS', 600, 52);

    // Right Header Badge: Format & Round
    ctx.fillStyle = '#a78bfa';
    ctx.font = 'black 14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${round.toUpperCase()}  ·  ${format}`, 1160, 50);

    // 8. TEAM A CARD (Left - 260px X)
    const centerAX = 290;
    const centerAY = 270;

    // Circular Logo Glow Frame A
    ctx.save();
    ctx.shadowColor = '#818cf8';
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#130d24';
    ctx.beginPath();
    ctx.arc(centerAX, centerAY, 65, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    if (teamALogo && imgA.complete && imgA.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerAX, centerAY, 60, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(imgA, centerAX - 60, centerAY - 60, 120, 120);
      ctx.restore();
    } else {
      ctx.fillStyle = '#c4b5fd';
      ctx.font = 'black 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(teamATag, centerAX, centerAY + 12);
    }

    // Team A Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'black 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(teamA.toUpperCase(), centerAX, 400);

    // Team A Tag & Status Pill
    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(`[ ${teamATag} ]  ·  VERIFIED SQUAD`, centerAX, 430);

    // 9. TEAM B CARD (Right - 910px X)
    const centerBX = 910;
    const centerBY = 270;

    // Circular Logo Glow Frame B
    ctx.save();
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#061a24';
    ctx.beginPath();
    ctx.arc(centerBX, centerBY, 65, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    if (teamBLogo && imgB.complete && imgB.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerBX, centerBY, 60, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(imgB, centerBX - 60, centerBY - 60, 120, 120);
      ctx.restore();
    } else {
      ctx.fillStyle = '#67e8f9';
      ctx.font = 'black 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isBye ? '-' : teamBTag, centerBX, centerBY + 12);
    }

    // Team B Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'black 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText((isBye ? 'BYE SLOT' : teamB).toUpperCase(), centerBX, 400);

    // Team B Tag & Status Pill
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(`[ ${isBye ? 'BYE' : teamBTag} ]  ·  ${isBye ? 'AUTO ADVANCE' : 'VERIFIED SQUAD'}`, centerBX, 430);

    // 10. CENTRAL BATTLE SHIELD / SCORE BADGE (600px X)
    const badgeX = 520;
    const badgeY = 220;
    const badgeW = 160;
    const badgeH = 120;

    ctx.save();
    ctx.shadowColor = '#a78bfa';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#090d1f';
    ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);
    ctx.restore();

    if (isBye) {
      ctx.fillStyle = '#34d399';
      ctx.font = 'black 26px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BYE', 600, 280);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('AUTO ADVANCE', 600, 310);
    } else if (isFinished || isLive) {
      ctx.fillStyle = isLive ? '#ef4444' : '#ffffff';
      ctx.font = 'black 46px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${scoreA} - ${scoreB}`, 600, 290);
      ctx.fillStyle = isLive ? '#f87171' : '#a78bfa';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(isLive ? '● LIVE' : 'FINAL SCORE', 600, 320);
    } else {
      ctx.fillStyle = '#a78bfa';
      ctx.font = 'black 52px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('VS', 600, 295);
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('MATCH READY', 600, 325);
    }

    // 11. REGIONAL KICKOFF TIME STRIP BELOW VS BADGE
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(400, 460, 400, 32);
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(400, 460, 400, 32);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🌐 8:00 PM PKT  ·  7:00 PM GST  ·  6:00 PM AST', 600, 481);

    // 12. GLASSMORPHIC OFFICIAL BROADCAST FOOTER
    ctx.fillStyle = 'rgba(8, 11, 24, 0.95)';
    ctx.fillRect(12, 540, 1176, 78);
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 540, 1176, 78);

    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('📺 twitch.tv/PixelPalace', 50, 585);

    ctx.textAlign = 'center';
    ctx.fillText('📷 @PixelPalaceEsports   ·   💬 discord.gg/PixelPalace', 600, 585);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#a78bfa';
    ctx.fillText('🌐 pixelpalace.gg', 1150, 585);

    // 13. TRIGGER PNG DOWNLOAD
    const link = document.createElement('a');
    link.download = `PixelPalace_Match_${match.id}_${teamATag}_vs_${teamBTag}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Preload Images or Trigger Draw Immediately
  if (totalImages === 0) {
    drawCanvas();
  } else {
    const handleLoad = () => {
      loadedCount++;
      if (loadedCount >= totalImages) drawCanvas();
    };

    if (teamALogo) {
      imgA.crossOrigin = 'anonymous';
      imgA.onload = handleLoad;
      imgA.onerror = handleLoad;
      imgA.src = teamALogo;
    }
    if (teamBLogo) {
      imgB.crossOrigin = 'anonymous';
      imgB.onload = handleLoad;
      imgB.onerror = handleLoad;
      imgB.src = teamBLogo;
    }
  }
}
