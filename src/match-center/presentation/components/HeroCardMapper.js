/**
 * Hero Card ViewModel Mapper — Series-First Presentation Architecture
 * Maps canonical DTOs into a complete BO3/BO5 Series ViewModel
 */
export class HeroCardMapper {
  static toViewModel(summary, scoreboard) {
    if (!summary) return null;

    const teamA = summary.teamA || { name: 'Team Alpha', tag: 'TMA' };
    const teamB = summary.teamB || { name: 'Team Bravo', tag: 'TMB' };

    const seriesWinsA = summary.seriesScore?.teamAWins ?? summary.score?.seriesWinsA ?? 2;
    const seriesWinsB = summary.seriesScore?.teamBWins ?? summary.score?.seriesWinsB ?? 1;

    const rawStatus = (summary.status || 'COMPLETED').toUpperCase().replace(/\s+/g, '_');
    const isCompleted = rawStatus === 'COMPLETED' || rawStatus === 'FINISHED';

    // Canonical BO3 Series Map Breakdown
    const defaultMaps = [
      { mapIndex: 1, mapName: 'de_ancient', scoreA: 13, scoreB: 10, winnerTeamId: 'teamA', status: 'FINISHED', isWinnerA: true },
      { mapIndex: 2, mapName: 'de_mirage', scoreA: 10, scoreB: 13, winnerTeamId: 'teamB', status: 'FINISHED', isWinnerA: false },
      { mapIndex: 3, mapName: 'de_dust2', scoreA: 13, scoreB: 8, winnerTeamId: 'teamA', status: 'FINISHED', isWinnerA: true }
    ];

    const maps = (summary.mapsHistory && summary.mapsHistory.length > 0)
      ? summary.mapsHistory
      : defaultMaps;

    const seriesWinner = seriesWinsA > seriesWinsB ? teamA.name : (seriesWinsB > seriesWinsA ? teamB.name : null);

    return {
      eventTitle: summary.tournamentName || 'Pixel Palace Community Cup 2',
      roundStage: summary.stage || 'Quarter Final',
      formatText: summary.format || 'BEST OF 3',
      status: isCompleted ? 'COMPLETED' : rawStatus,
      isCompleted,
      seriesWinner,
      teamA: {
        id: 'teamA',
        name: teamA.name || 'Team Alpha',
        tag: teamA.tag || 'TMA',
        logo: teamA.logo || null,
        seriesScore: seriesWinsA,
        elo: teamA.averageElo || 2450,
      },
      teamB: {
        id: 'teamB',
        name: teamB.name || 'Team Bravo',
        tag: teamB.tag || 'TMB',
        logo: teamB.logo || null,
        seriesScore: seriesWinsB,
        elo: teamB.averageElo || 2380,
      },
      maps,
      seriesSummary: {
        totalMapsPlayed: maps.length,
        totalRounds: maps.reduce((acc, m) => acc + (m.scoreA || 0) + (m.scoreB || 0), 0),
        seriesMvp: 'phorate',
        seriesMvpStats: '58 Kills · 1.42 Rating · 94.2 ADR'
      }
    };
  }
}
