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

export const submitRegistration = async (tournamentId, formData) => {
  const tournament = tournaments.find((t) => t.id === tournamentId);
  
  if (!tournament) {
    throw new Error(`Tournament with ID ${tournamentId} not found.`);
  }

  if (!tournament.sheetsEndpoint) {
    // Mock successful response if no endpoint is configured (for scaffolding/testing)
    console.warn("No Sheets Endpoint configured. Returning mock success.");
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000));
  }

  try {
    const response = await fetch(tournament.sheetsEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error("Error submitting registration:", error);
    throw error;
  }
};
