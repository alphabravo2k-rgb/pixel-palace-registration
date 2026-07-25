# Pixel Palace Tournament OS — Production Truthfulness Policy v1.0
## CREDIBILITY & CAPABILITY STATUS GOVERNANCE

---

# 1. Core Principle

> **Never imply a capability that doesn't exist. Credibility is more valuable than feature count.**

Pixel Palace Tournament OS enforces strict capability truthfulness across all UI components and API endpoints. No button, action, or label may promise functionality that is not backed by real data or active server capability.

---

# 2. Capability Status Classification

Every feature, metric, and action MUST belong to one of four transparent status categories:

| Status | Code / Badge | UI Presentation & Behavior | Example |
| :--- | :---: | :--- | :--- |
| **Live** | `LIVE` | Fully functional, backed by active server telemetry or datastore. | `Series Score (2-1)`, `Round Score`, `Map Scores` |
| **Derived** | `DERIVED` | Programmatically computed from canonical DTO fields; 100% reproducible. | `Rating 2.0`, `ADR`, `KAST %`, `Momentum` |
| **Unavailable** | `UNAVAILABLE` | Feature exists conceptually, but required telemetry is missing for this match. Display clear explanation. | `Spatial Heatmaps (Requires Demo Parser)` |
| **Planned** | `PLANNED` | Not implemented; hidden from spectator view and visible strictly on admin/dev roadmaps. | `AI Match Prediction Engine` |

---

# 3. Required Wording & Component Standards

### ❌ Prohibited Misleading Patterns vs ✅ Approved Truthful Patterns

- ❌ `▶ Play Replay` (implies video clipping / live stream playback)
  - ✅ `📋 Copy Tick Timestamp` or `📌 Tick Marker (Tick #142850)`

- ❌ `🎬 Broadcast Top Plays & Highlights` (implies video clips)
  - ✅ `📌 Key Match Moments`

- ❌ `Opponent Scouting Center` (implies historical multi-season database)
  - ✅ `Match Preparation (Based on Current Match DTO)`

- ❌ `AI Match Predictor` (implies machine learning engine)
  - ✅ `Telemetry-Driven Objective Observations`

- ❌ `Heatmaps (Placeholder Image)`
  - ✅ `Spatial Heatmaps — Unavailable (Requires CS2 Demo Replay Parser)`
