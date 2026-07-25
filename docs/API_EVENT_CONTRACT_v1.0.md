# Pixel Palace Tournament OS — API & Event Contract v1.0
## CANONICAL DTO SCHEMAS, WEBHOOKS & VERSIONING POLICY

---

# 1. Versioning & Backward Compatibility Policy

- **API Base Endpoint**: `/exec?action=v1/getMatch`
- **Versioning Scheme**: SemVer `v1.0.0`
- **Backward Compatibility**: Non-breaking additions are made strictly in minor versions. Breaking schema changes trigger major endpoint increments (e.g. `v2/getMatch`).
- **Response Format**: `application/json`

---

# 2. Canonical Match DTO Schema

```json
{
  "version": "1.0.0",
  "matchId": "MC-2026-0000749",
  "status": "COMPLETED",
  "timestamp": "2026-07-25T15:10:00Z",
  "tournament": {
    "name": "Pixel Palace Community Cup 2",
    "stage": "GRAND FINAL",
    "format": "BEST OF 3",
    "prizePool": "£2,000 GBP + Trophy"
  },
  "seriesScore": {
    "teamAWins": 2,
    "teamBWins": 1
  },
  "winnerId": "team_donstu_01",
  "teamA": { "name": "DONSTU", "tag": "TMA" },
  "teamB": { "name": "Basement Bobs", "tag": "TMB" },
  "mapList": ["de_ancient", "de_mirage", "de_dust2"],
  "mapsStats": [
    { "map_index": 0, "map_name": "de_ancient", "score_team1": 13, "score_team2": 10 },
    { "map_index": 1, "map_name": "de_mirage", "score_team1": 10, "score_team2": 13 },
    { "map_index": 2, "map_name": "de_dust2", "score_team1": 13, "score_team2": 8 }
  ],
  "playerStats": {
    "teamA": [
      { "name": "phorate", "kills": 52, "deaths": 36, "assists": 14, "damage": 7650, "rating": 1.43 }
    ],
    "teamB": [
      { "name": "device", "kills": 45, "deaths": 39, "assists": 12, "damage": 6800, "rating": 1.15 }
    ]
  },
  "auditLog": [
    { "time": "20:10", "type": "WARMUP", "text": "Knife round completed." }
  ]
}
```

---

# 3. Webhook Event Contracts

- `match.scheduled`: Fired when a match is created in Google Sheets.
- `match.started`: Fired when server RCON reports live status.
- `map.concluded`: Fired when a map finishes.
- `series.concluded`: Fired when a winner is confirmed.
- `dispute.created`: Fired when a referee intervention is requested.
