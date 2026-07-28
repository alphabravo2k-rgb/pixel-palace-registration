/**
 * @deprecated Use PixelPalaceRepository directly or TournamentService
 * Re-exports pixelPalaceRepository for legacy compatibility.
 */
import { pixelPalaceRepository } from './PixelPalaceRepository';

export const fluxRepository = pixelPalaceRepository;
export class FluxRepository {
  async getBracket(url) {
    return pixelPalaceRepository.getBracket(url);
  }
  async getMatch(matchId, url) {
    return pixelPalaceRepository.getMatch(matchId, url);
  }
}
