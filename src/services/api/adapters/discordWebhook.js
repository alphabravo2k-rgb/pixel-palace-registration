/**
 * DISCORD WEBHOOK ADAPTER — Phase 2 Prep
 * 
 * Takes a CanonicalSchema submission payload and formats it into
 * a Discord Rich Embed payload suitable for a webhook POST request.
 */

/**
 * Format registration into a Discord Webhook Payload
 * @param {import('../../../schemas/canonical').CanonicalSchema} canonicalData 
 * @param {string} tournamentName 
 * @returns {Record<string, any>} Discord Webhook compatible payload
 */
export const formatForDiscord = (canonicalData, tournamentName = "Pixel Palace Tournament") => {
  const { team, roster, metadata, submission_id } = canonicalData;
  
  // Calculate average ELO
  const elos = roster
    .map(p => parseInt(p.faceitElo, 10))
    .filter(elo => !isNaN(elo) && elo > 0);
  const avgElo = elos.length > 0 ? Math.round(elos.reduce((a, b) => a + b, 0) / elos.length) : 'N/A';

  // Build the rich embed
  const embed = {
    title: `🏆 New Registration: ${team.team_name} [${team.team_tag}]`,
    color: 0x00F0FF, // Neon Cyan
    timestamp: new Date().toISOString(),
    thumbnail: {
      url: team.logo_url || "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_dust2.png"
    },
    fields: [
      {
        name: "Tournament",
        value: tournamentName,
        inline: true
      },
      {
        name: "Region",
        value: team.region,
        inline: true
      },
      {
        name: "Average ELO",
        value: avgElo.toString(),
        inline: true
      },
      {
        name: "Status",
        value: metadata.status === 'PENDING REVIEW' ? '⚠️ PENDING REVIEW (Soft Ban Match)' : '✅ CLEAN (Verified)',
        inline: false
      }
    ],
    footer: {
      text: `Submission ID: ${submission_id.substring(0, 8)}... | ${metadata.sub_included ? 'Sub Included' : 'No Sub'}`
    }
  };

  // Add roster breakdown
  const rosterDetails = roster.map((p, idx) => {
    let title = `Player ${idx + 1}`;
    if (p.role === 'CAPTAIN') title = `👑 Captain`;
    if (p.role === 'SUBSTITUTE') title = `🔄 Substitute`;
    
    return {
      name: title,
      value: `**${p.ign}**\nLevel: ${p.faceitLevel} | ELO: ${p.faceitElo}\nSteam: [Link](${p.steam}) | Discord: ${p.discord}`,
      inline: true
    };
  });

  embed.fields.push(...rosterDetails);

  return {
    username: "Pixel Palace Oracle",
    avatar_url: "https://i.imgur.com/your-bot-avatar.png",
    embeds: [embed]
  };
};

/**
 * Example usage:
 * 
 * const discordPayload = formatForDiscord(canonicalPayload, tournament.name);
 * await fetch(tournament.discordWebhookUrl, {
 *    method: 'POST',
 *    headers: { 'Content-Type': 'application/json' },
 *    body: JSON.stringify(discordPayload)
 * });
 */
