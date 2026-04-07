export const tournaments = [
  {
    id: "chaos-ii",
    name: "Pixel Palace Chaos II",
    slug: "chaos-ii",
    status: "LIVE",
    format: "2v2",
    gameMode: "CS2 Wingman",
    prizePool: "$400",
    maxTeams: 64,
    region: "PAK / IND",
    inviteSlots: 24,
    openSlots: 40,
    startTime: "9:00 PM PKT ONWARDS",
    tournamentDate: "2026-04-18T21:00:00Z",
    registrationDeadline: "2026-04-18T23:59:00Z",
    antiCheat: "Akros",
    sheetsEndpoint: "", 
    substitutes: { min: 0, max: 1 },
    playersPerTeam: 2,
    thumbnail: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_overpass.png",
    fields: [
      "inviteCode",
      "teamName",
      "teamTag",
      "teamRegion",
      "logoLink",
      "p1Discord", "p1Steam", "p1Faceit", "p1Rank", 
      "p2Discord", "p2Steam", "p2Faceit", "p2Rank", 
      "p3Discord", "p3Steam", "p3Faceit", "p3Rank"  
    ],
    maps: [
      "Overpass", "Cbble", "Train", "Vertigo", "Nuke"
    ]
  },
  {
    id: "esports-open-s1",
    name: "Pixel Palace Esports Open",
    slug: "esports-open-s1",
    status: "UPCOMING",
    format: "5v5",
    gameMode: "CS2 Competitive",
    prizePool: "TBA",
    maxTeams: 32,
    region: "ME / PAK",
    inviteSlots: 0,
    openSlots: 32,
    startTime: "TBD",
    tournamentDate: "2026-05-10T18:00:00Z",
    registrationDeadline: "2026-05-05T23:59:00Z",
    antiCheat: "Akros",
    sheetsEndpoint: "", 
    substitutes: { min: 0, max: 1 },
    playersPerTeam: 5,
    thumbnail: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_mirage.png",
    fields: [
      "inviteCode",
      "teamName",
      "teamTag",
      "teamRegion",
      "logoLink",
      "p1Discord", "p1Steam", "p1Faceit", "p1Rank", 
      "p2Discord", "p2Steam", "p2Faceit", "p2Rank",
      "p3Discord", "p3Steam", "p3Faceit", "p3Rank",
      "p4Discord", "p4Steam", "p4Faceit", "p4Rank",
      "p5Discord", "p5Steam", "p5Faceit", "p5Rank",
      "p6Discord", "p6Steam", "p6Faceit", "p6Rank", 
    ],
    maps: [
      "Ancient", "Anubis", "Dust2", "Inferno", "Mirage", "Nuke", "Overpass"
    ]
  },
  {
    id: "community-cup-1",
    name: "Community Cup 1.0",
    slug: "community-cup-1",
    status: "ARCHIVED",
    format: "5v5",
    gameMode: "CS2 Competitive",
    prizePool: "$200",
    maxTeams: 16,
    region: "PAK",
    inviteSlots: 0,
    openSlots: 16,
    startTime: "TBD",
    tournamentDate: "2025-12-15T18:00:00Z",
    registrationDeadline: "2025-12-10T23:59:00Z",
    antiCheat: "Akros",
    sheetsEndpoint: "", 
    substitutes: { min: 0, max: 1 },
    playersPerTeam: 5,
    thumbnail: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_inferno.png",
    fields: [
      "teamName",
      "teamTag",
      "teamRegion",
      "logoLink",
      "p1Discord", "p1Steam", "p1Faceit", "p1Rank", 
      "p2Discord", "p2Steam", "p2Faceit", "p2Rank",
      "p3Discord", "p3Steam", "p3Faceit", "p3Rank",
      "p4Discord", "p4Steam", "p4Faceit", "p4Rank",
      "p5Discord", "p5Steam", "p5Faceit", "p5Rank"
    ],
    maps: [
      "Dust2", "Mirage", "Overpass"
    ]
  }
];

export const getTournamentBySlug = (slug) => {
  return tournaments.find((t) => t.slug === slug);
};
