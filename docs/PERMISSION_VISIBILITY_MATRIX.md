# Pixel Palace Tournament OS — Permission & Visibility Matrix v1.0
## ROLE-BASED ACCESS CONTROL & DATA PRIVACY GOVERNANCE

---

# 1. Role Definitions

1. **👥 Spectator / Broadcast**: General public, stream viewers, casters. Wants clean UI, broadcast storytelling, high-level stats, zero technical noise.
2. **📊 Analyst / Coach**: Professional analysts, team managers, esports media. Wants deep tactical metrics, H2H scouting, economy timelines, and calculation explainability (`Why?` drawers).
3. **🛡️ Referee / Admin**: Tournament organizers, operational referees. Wants server health, 128 tick telemetry, GOTV status, RCON connects, pause logs, penalty history.
4. **💻 Developer / API Consumer**: System integrators, automated bots, data consumers. Wants full DTO payloads, raw data lineage, provider health, revision IDs, confidence scores.

---

# 2. Permission & Visibility Matrix

| Feature / Data Element | Spectator | Analyst | Admin / Referee | Developer / API |
| :--- | :---: | :---: | :---: | :---: |
| **Hero Scoreboard & Winner Banner** | Read | Read | Read | Read |
| **Series Story & Veto Timeline** | Read | Read | Read | Read |
| **Round Center & Scoreboard** | Read | Read | Read | Read |
| **Tactical Economy & Utility Metrics** | Read | Read | Read | Read |
| **Team Head-to-Head Scouting** | Read | Read | Read | Read |
| **Telemetry Provenance (`Why?` Drawer)** | Hidden | Read | Read | Read |
| **Server IP & RCON Connect String** | Hidden | Hidden | Read | Read |
| **Referee Pause & Penalty Audit Log** | Hidden | Read | Read / Write | Read / Write |
| **Raw Payload DTO & Revision History** | Hidden | Hidden | Read | Read |
| **Manual Match Override & Force Refresh** | Hidden | Hidden | Write | Write |
