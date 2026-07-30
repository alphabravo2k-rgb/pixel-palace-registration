/**
 * discordAnnouncementGenerator.js
 * Generates enterprise-grade, ready-to-copy Discord Markdown match sheets
 * for tournament staff, casters, and team captains.
 */

export const generateDiscordMatchSheet = (match, type = 'PRE_MATCH', tournament = {}) => {
  if (!match) return '';

  const team1Name = match.team1?.name || match.team1_name || 'TBD';
  const team2Name = match.team2?.name || match.team2_name || 'TBD';
  const team1Tag = match.team1?.tag || match.team1_tag || 'T1';
  const team2Tag = match.team2?.tag || match.team2_tag || 'T2';
  const stage = match.matchStage || match.stage || `Round ${match.round_id || 1}`;
  const boFormat = match.best_of ? `BO${match.best_of}` : (match.bestOf ? `BO${match.bestOf}` : 'BO1');
  const matchId = match.id || match.match_id || 'N/A';
  const server = match.serverName || match.server_name || 'Protected Server #01 (128 Tick)';
  const streamUrl = tournament.twitchUrl || 'https://www.twitch.tv/pXpLgg';

  switch (type) {
    case 'PRE_MATCH':
      return `\`\`\`yaml
==================================================
🎮 PIXEL PALACE CS2 // MATCH ANNOUNCEMENT
==================================================
MATCH ID : #${matchId}
STAGE    : ${stage.toUpperCase()}
FORMAT   : ${boFormat}

⚔️ MATCHUP:
  [${team1Tag}] ${team1Name}
      VS
  [${team2Tag}] ${team2Name}

📅 SCHEDULED TIME:
  🇵🇰 8:00 PM PKT | 🇮🇳 8:30 PM IST | 🇦🇪 7:00 PM GST

🔒 SERVER & ANTI-CHEAT:
  Server : ${server}
  Engine : Akros Anti-Cheat Client Mandatory (v3.2)

📌 CAPTAIN ACTION:
  Both team captains please report to your designated Discord match channel 15 minutes prior for live map veto.
==================================================
\`\`\``;

    case 'CAPTAIN_READY':
      return `\`\`\`yaml
==================================================
🛡️ CAPTAIN MATCH LOBBY // MATCH #${matchId}
==================================================
MATCH    : ${team1Name} vs ${team2Name}
FORMAT   : ${boFormat} (${stage})

📍 CHECK-IN STATUS:
  [${team1Tag}] Captain : READY ✅
  [${team2Tag}] Captain : READY ✅

🗺️ MAP PICK/BAN VETO:
  Veto Status : IN PROGRESS / READY
  Decider Map : ${match.current_map || match.map || 'To Be Vetoed'}

🔐 CONNECT INSTRUCTIONS:
  1. Launch Akros Anti-Cheat Client.
  2. Join Protected Tournament Server.
==================================================
\`\`\``;

    case 'LIVE_BROADCAST':
      return `\`\`\`yaml
==================================================
🔴 MATCH LIVE ON BROADCAST // MATCH #${matchId}
==================================================
🔥 ${team1Name} (${team1Tag}) vs ${team2Name} (${team2Tag})

SCORE : ${match.score1 ?? 0} - ${match.score2 ?? 0}
MAP   : ${match.current_map || match.map || 'de_inferno'}

📺 OFFICIAL TWITCH STREAM:
  ${streamUrl}

🎙️ CASTERS: Official Broadcast Desk
==================================================
\`\`\``;

    case 'POST_MATCH':
      const winnerName = (match.score1 > match.score2) ? team1Name : (match.score2 > match.score1 ? team2Name : 'TBD');
      return `\`\`\`yaml
==================================================
🏆 MATCH RESULT // MATCH #${matchId}
==================================================
MATCH  : ${team1Name} vs ${team2Name}
STAGE  : ${stage}

FINAL SCORE :
  ${team1Name} [ ${match.score1 ?? 0} : ${match.score2 ?? 0} ] ${team2Name}

🎉 WINNER   : ${winnerName.toUpperCase()}
==================================================
\`\`\``;

    default:
      return '';
  }
};
