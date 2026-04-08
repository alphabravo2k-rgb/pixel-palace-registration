export const tournaments = [
  {
    id: "chaos-ii",
    name: "Wingman Chaos II",
    slug: "chaos-ii",
    status: "LIVE",
    format: "2v2",
    gameMode: "CS2 Wingman",
    prizePool: "TBA",
    maxTeams: 50,
    openSlots: 50,     // Replaced 64 total / 24 invite logic
    inviteSlots: 0,    // Pure first-come, first-serve
    region: "Pak Ind & Middle East",
    startTime: "9:00 PM PKT ONWARDS",
    tournamentDate: "2026-04-24T21:00:00+05:00", // Apr 24-27
    registrationDeadline: "2026-04-18T23:59:00+05:00",
    thumbnail: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_overpass.png",
    antiCheat: "Akros",
    playersPerTeam: 2,
    substitutes: { min: 0, max: 1 },
    // Updated Active Duty Wingman Maps
    maps: ["Poseidon", "Sanctum", "Overpass", "Vertigo", "Nuke", "Inferno"],
    sheetsEndpoint: "https://script.google.com/macros/s/AKfycby0ryeemIms7XhpnEohHms0Cm3k2gUIgl0_XBDhz7gjJfGH5Hi7Qhm12l-ERNd9C7ACgw/exec", // Add your Master Sheet Apps Script URL here
    customVerification: [
      "MANDATORY ANTI-CHEAT — Our duo acknowledges that Akros Anti-Cheat must be installed by all players.",
      "COMMUNICATION — All players have joined the Pixel Palace Discord server.",
      "VOICE COMMS — All players confirm to join Pixel Voice Channels during their matches.",
      "SCHEDULE — We confirm availability for the registration deadline and all tournament dates."
    ]
  },
  
  // --- REAL ARCHIVED HISTORY FROM EXTRACT ---
  {
    id: "ramadan-league",
    name: "CS2 Ramadan League 2026",
    slug: "ramadan-league",
    status: "ARCHIVED",
    format: "5v5",
    gameMode: "CS2 Competitive",
    prizePool: "$400",
    maxTeams: 8,
    region: "PAK / IND",
    tournamentDate: "2026-03-01T22:30:00Z",
    registrationDeadline: "2026-02-28T23:59:00Z",
    thumbnail: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_dust2.png",
    playersPerTeam: 5
  },
  {
    id: "community-cup-1",
    name: "CS2 5v5 Community Cup",
    slug: "community-cup-1",
    status: "ARCHIVED",
    format: "5v5",
    gameMode: "CS2 Competitive",
    prizePool: "$4,000",
    maxTeams: 20,
    region: "ME / PAK",
    tournamentDate: "2026-01-09T18:00:00Z",
    registrationDeadline: "2026-01-08T23:59:00Z",
    thumbnail: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_inferno.png",
    playersPerTeam: 5
  },
  {
    id: "wingman-ep1",
    name: "CS2 Wingman Clash – Ep 01",
    slug: "wingman-ep1",
    status: "ARCHIVED",
    format: "2v2",
    gameMode: "CS2 Wingman",
    prizePool: "$800",
    maxTeams: 64,
    region: "PAK / IND",
    tournamentDate: "2025-11-28T18:00:00Z",
    registrationDeadline: "2025-11-27T23:59:00Z",
    thumbnail: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_vertigo.png",
    playersPerTeam: 2
  }
];

export const getTournamentBySlug = (slug) => {
  return tournaments.find((t) => t.slug === slug);
};
