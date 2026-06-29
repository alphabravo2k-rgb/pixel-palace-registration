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

    // Identify username from URL or use as raw username
    let username = cleanUrl;
    if (cleanUrl.includes('faceit.com')) {
      const nameMatch = cleanUrl.match(/faceit\.com\/(?:[a-z]{2}\/)?players\/([^/?#]+)/i);
      if (nameMatch) {
        username = nameMatch[1];
      } else {
        throw new Error('Could not identify FACEIT username from URL constraint.');
      }
    }

    if (!faceitApiKey) {
      throw new Error('NO_API_KEY');
    }

    const response = await fetch(`https://open.faceit.com/data/v4/players?nickname=${encodeURIComponent(username)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${faceitApiKey}`
      }
    });

    if (!response.ok) {
        throw new Error(`Faceit API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Track if we fallback to csgo data
    const source = data.games?.cs2 ? 'cs2' : (data.games?.csgo ? 'csgo' : 'none');
    const cs2Data = data.games?.cs2 || data.games?.csgo; 

    return {
      nickname: data.nickname || username,
      faceitLevel: cs2Data?.skill_level || 'N/A',
      faceitElo: cs2Data?.faceit_elo || 'N/A',
      cs2RankLabel: cs2Data?.game_skill_level_label || 'Not Linked',
      steam64: cs2Data?.game_player_id || null,
      avatar: data.avatar || null,
      country: data.country || null,
      _source: source,
      _fetchedAt: Date.now()
    };

  } catch (error) {
    console.error('Faceit fetch error:', error);
    throw error;
  }
};
