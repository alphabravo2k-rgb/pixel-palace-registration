/**
 * Social Media Match Graphic Exporter
 * Generates clean 1200x630 Match Banners for Discord, Twitter/X, and Instagram
 */

export function generateSocialMatchCard(match) {
  const teamA = match.teamA?.name || match.team1_name || match.team1 || 'Team A';
  const teamB = match.teamB?.name || match.team2_name || match.team2 || 'Team B';
  const round = match.round || 'Round of 32';
  const format = match.format || 'BO1';

  // Create temporary canvas element
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');

  // Background Gradient
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, '#070a14');
  gradient.addColorStop(0.5, '#0b0f26');
  gradient.addColorStop(1, '#050711');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 630);

  // Border Accent Line
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 1180, 610);

  // Tournament Header
  ctx.fillStyle = '#a78bfa';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PIXEL PALACE COMMUNITY CUP 2', 600, 80);

  // Round & Format Pill
  ctx.fillStyle = '#818cf8';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(`${round.toUpperCase()}  ·  ${format}`, 600, 125);

  // VS Graphic Box
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(520, 260, 160, 100);
  ctx.strokeStyle = '#818cf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(520, 260, 160, 100);

  ctx.fillStyle = '#a78bfa';
  ctx.font = 'black 48px monospace';
  ctx.fillText('VS', 600, 325);

  // Team A Name (Left)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(teamA.toUpperCase(), 480, 320);

  // Team B Name (Right)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(teamB.toUpperCase(), 720, 320);

  // Footer Tagline
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('OFFICIAL CS2 COMPETITIVE MATCH  ·  PIXEL PALACE OPERATING SYSTEM', 600, 560);

  // Download Trigger
  const link = document.createElement('a');
  link.download = `Match_${match.id}_${teamA}_vs_${teamB}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
