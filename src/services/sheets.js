/**
 * LEGACY COMPATIBILITY LAYER
 *
 * This file exists solely to prevent import churn across existing consumers.
 * Internally, all logic has moved to src/services/api/client.js.
 *
 * Consumers still importing from this file (Register.jsx, TournamentForm.jsx,
 * useFormSubmit.js) continue to work without changes.
 *
 * Migration path: Update each consumer to import from './api/client' directly,
 * then delete this file.
 */
export {
  submitToGateway as submitRegistration,
  validateCode as validateInviteCode,
  fetchSlots as fetchTournamentSlots,
  fetchTeams as fetchTournamentTeams,
  fetchBracket as fetchTournamentBracket,
  trackRegistration,
} from './api/client';
