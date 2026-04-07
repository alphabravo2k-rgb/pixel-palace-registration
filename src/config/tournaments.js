export const tournaments = [
  {
    id: "esports-open-s1",
    name: "Pixel Palace Esports Open — Season 1",
    slug: "esports-open-s1",
    status: "active",
    format: "5v5",
    gameMode: "competitive",
    prizePool: "TBA",
    maxTeams: 32,
    inviteSlots: 0,
    openSlots: 32,
    startTime: "TBD",
    tournamentDate: "APRIL 03, 2026",
    registrationDeadline: "2026-03-31T23:59:00Z",
    antiCheat: "Akros",
    sheetsEndpoint: "", 
    substitutes: { min: 0, max: 1 },
    playersPerTeam: 5,
    fields: [
      "inviteCode",
      "teamName",
      "teamTag",
      "teamRegion",
      "logoLink",
      "p1Discord", "p1Steam", "p1Faceit", "p1Rank", // Captain
      "p2Discord", "p2Steam", "p2Faceit", "p2Rank",
      "p3Discord", "p3Steam", "p3Faceit", "p3Rank",
      "p4Discord", "p4Steam", "p4Faceit", "p4Rank",
      "p5Discord", "p5Steam", "p5Faceit", "p5Rank",
      "p6Discord", "p6Steam", "p6Faceit", "p6Rank", // Sub
    ],
    maps: [
      "Ancient", "Anubis", "Dust2", "Inferno", "Mirage", "Nuke", "Overpass"
    ]
  },
  {
    id: "chaos-ii",
    name: "Pixel Palace Chaos II",
    slug: "chaos-ii",
    status: "active",
    format: "2v2",
    gameMode: "CS2 WINGMAN",
    prizePool: "$400",
    maxTeams: 64,
    inviteSlots: 24,        // invite-code-gated
    openSlots: 40,          // open registration
    startTime: "9:00 PM PKT ONWARDS",
    tournamentDate: "TBD",
    registrationDeadline: "2026-04-18T23:59:00Z",
    antiCheat: "Akros",
    sheetsEndpoint: "",     // to be filled
    substitutes: { min: 0, max: 1 },
    playersPerTeam: 2,
    fields: [
      "inviteCode",
      "teamName",
      "teamTag",
      "teamRegion",
      "logoLink",
      "p1Discord", "p1Steam", "p1Faceit", "p1Rank",   // Captain
      "p2Discord", "p2Steam", "p2Faceit", "p2Rank",   // Partner
      "p3Discord", "p3Steam", "p3Faceit", "p3Rank"    // Sub (optional)
    ],
    maps: [
      "Overpass", "Cobblestone", "Shoreline", "Lake", "Mutiny", "Guard"
    ]
  }
];

export const getTournamentBySlug = (slug) => {
  return tournaments.find((t) => t.slug === slug);
};
