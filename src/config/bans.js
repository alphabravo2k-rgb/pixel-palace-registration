/**
 * GLOBAL SOFT-BAN LIST
 * 
 * This list is used to cross-check players during registration.
 * In Phase 2, this will move to a Supabase 'bans' table.
 */
export const globalBans = [
  {
    discord: "toxic_player#0000",
    reason: "Unsportsmanlike conduct in Season 1",
    expiry: "2026-12-31"
  },
  {
    steam64: "76561198000000001",
    reason: "Suspicious activity / Potential smurfing",
    expiry: "2026-06-30"
  },
  {
    discord: "scammer_1337",
    reason: "Attempted prize fraud",
    expiry: "indefinite"
  }
];

/**
 * Checks if a player is in the soft-ban list.
 * @returns {object|null} - The ban object if found, otherwise null.
 */
export const checkBanStatus = (player) => {
  if (!player) return null;
  
  return globalBans.find(ban => {
     const discordMatch = ban.discord && player.discord && (ban.discord.toLowerCase() === player.discord.toLowerCase());
     const steamMatch = ban.steam64 && player.steam64 && (ban.steam64 === player.steam64);
     return discordMatch || steamMatch;
  }) || null;
};
