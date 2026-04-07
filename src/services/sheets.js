/**
 * Phase 1: Google Sheets API Handler
 * 
 * PHASE 2 MIGRATION NOTES:
 * // PHASE 2 MIGRATION: Replace the fetch() call below with:
 * // import { supabase } from '../lib/supabase'
 * // await supabase.from('registrations').insert({ tournament_id: tournamentId, ...formData })
 * // No other files need to change.
 */

import { tournaments } from "../config/tournaments";

// For live validation of invite codes
export const validateInviteCode = async (tournamentId, code) => {
  const tournament = tournaments.find((t) => t.id === tournamentId);
  if (!tournament || !tournament.sheetsEndpoint) {
    // Mock response
    return new Promise(resolve => setTimeout(() => resolve({ valid: code === "ADMIN" }), 800));
  }
  
  try {
    const res = await fetch(`${tournament.sheetsEndpoint}?validateCode=${encodeURIComponent(code)}`);
    const data = await res.json();
    return data;
  } catch(err) {
    console.error("Code validation error", err);
    throw err;
  }
}

// For fetching live slot counters (Invite vs Open)
export const fetchTournamentSlots = async (tournamentId) => {
  const tournament = tournaments.find((t) => t.id === tournamentId);
  if (!tournament || !tournament.sheetsEndpoint) {
    // Mock response based on tournament config
    return new Promise(resolve => setTimeout(() => resolve({
      inviteConfirmed: 12, // mock data
      openConfirmed: 30, // mock data
      isFull: false
    }), 1000));
  }

  try {
    const res = await fetch(`${tournament.sheetsEndpoint}?action=getSlots&t=${new Date().getTime()}`);
    const data = await res.json();
    return data; 
  } catch(err) {
    console.error("Fetch slots error", err);
    throw err;
  }
}

export const submitRegistration = async (tournamentId, formData) => {
  const tournament = tournaments.find((t) => t.id === tournamentId);
  
  if (!tournament) {
    throw new Error(`Tournament with ID ${tournamentId} not found.`);
  }

  if (!tournament.sheetsEndpoint) {
    // Mock successful response
    console.warn("No Sheets Endpoint configured. Returning mock success.");
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Random chance of fake failure just for testing error boundary if needed
        // resolve({ success: true })
        resolve({ success: true }) 
      }, 1500)
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(tournament.sheetsEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(formData),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return { success: true, data };
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error("Connection Timeout. Please retry.");
    }
    console.error("Error submitting registration:", err);
    throw err;
  }
};
