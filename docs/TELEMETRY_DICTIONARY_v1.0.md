# Pixel Palace Tournament OS — Telemetry Dictionary v1.0
## DATA LINEAGE, CALCULATION FORMULAS & DEPENDENCY MATRIX

---

# 1. Telemetry Dictionary & Lineage Overview

Every metric in Pixel Palace OS is defined by its **Formula**, **Dependencies**, **Source Provider**, **Confidence Score**, and **Role Visibility**.

---

# 2. Key Metrics Lineage Dictionary

### 📊 Player Rating 2.0 (`derivedRating`)
- **Formula**: `Rating = (Kills * 0.04) + (Assists * 0.02) - (Deaths * 0.03) + ((Damage / TotalRounds) * 0.005) + 0.1`
- **Derived From**: `kills`, `assists`, `deaths`, `damage`, `totalRounds`
- **Source Provider**: FluxBot DTO / Apps Script Repository
- **Update Cadence**: End of each round
- **Confidence**: 100%
- **Visibility**: All Roles (Spectator, Analyst, Admin)

### 📊 Average Damage Per Round (`adr`)
- **Formula**: `ADR = Total Damage / Total Rounds`
- **Derived From**: `damage`, `totalRounds`
- **Source Provider**: FluxBot DTO / Sheet
- **Update Cadence**: End of each round
- **Confidence**: 100%
- **Visibility**: All Roles

### 📊 Kill, Assist, Survive, Trade % (`kast`)
- **Formula**: `KAST % = ((Rounds with Kill + Rounds with Assist + Rounds Survived + Rounds Traded) / Total Rounds) * 100`
- **Derived From**: `kills`, `assists`, `deaths`, `tradeKills`, `totalRounds`
- **Source Provider**: FluxBot DTO
- **Update Cadence**: End of map
- **Confidence**: 100%
- **Visibility**: All Roles

### 📊 Team Momentum Score (`momentumScore`)
- **Formula**: `Momentum = (Consecutive Wins * 15) + (Opening Duels * 10) + (Economy Advantage * 0.001) + (Utility Dmg * 0.05)`
- **Derived From**: `roundHistory[]`, `openingDuels`, `equipValue`, `utilityDamage`
- **Source Provider**: Derived Telemetry Engine
- **Update Cadence**: Real-time per round
- **Confidence**: 98%
- **Visibility**: Analyst, Admin, Developer (`Why?` Drawer)

---

# 3. Explainability (`Why?` Drawer Engine)

When an Analyst or Admin clicks **`Why?`** on any insight, Pixel Palace OS renders a provenance breakdown:

```json
{
  "metric": "Series Momentum",
  "score": 87,
  "confidence": "98%",
  "sourceProvider": "Derived Telemetry Engine v1.0",
  "dependencies": [
    "Won 6 of last 8 rounds",
    "Three consecutive opening duels",
    "+$11,800 economy advantage",
    "Utility damage +310"
  ],
  "lastUpdated": "2026-07-25T15:10:00Z"
}
```
