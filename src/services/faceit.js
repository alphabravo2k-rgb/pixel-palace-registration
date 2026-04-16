/**
 * FACEIT Auto-Fetch API Resolver
 * Pulls ELO, CS2 Level, and Ranks from faceit open data API
 */

export const fetchFaceitProfile = async (profileUrl, faceitApiKey) => {
  if (!profileUrl) return null;

  try {
    let cleanUrl = profileUrl.trim();
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    // Attempt to extract username from URL
    const nameMatch = cleanUrl.match(/faceit\.com\/en\/players\/([^/?#]+)/);
    if (!nameMatch) {
      throw new Error('Could not identify FACEIT username from URL constraint.');
    }

    const username = nameMatch[1];

    if (!faceitApiKey) {
      throw new Error('NO_API_KEY');
    }

    const response = await fetch(`https://open.faceit.com/data/v4/players?nickname=${username}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${faceitApiKey}`
      }
    });

    if (!response.ok) {
        throw new Error(`Faceit API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Fallbacks if cs2 isn't their primary registered game
    const cs2Data = data.games?.cs2 || data.games?.csgo; 

    return {
      faceitLevel: cs2Data?.skill_level || 'N/A',
      faceitElo: cs2Data?.faceit_elo || 'N/A',
      cs2RankLabel: cs2Data?.game_skill_level_label || 'Not Linked',
      steam64: cs2Data?.game_player_id || null, // Valuable since it cross-references Steam64
      avatar: data.avatar || null,
      country: data.country || null
    };

  } catch (error) {
    console.error('Faceit fetch error:', error);
    throw error;
  }
};
