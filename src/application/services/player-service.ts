import type { PlayerConfig } from '@/application/interfaces/player/player-config';
import type { IdGeneratorStrategy } from '@/application/strategies/id-generator/id-generator-strategy';
import { Player } from '@/core/entities/player';

export class PlayerService {
  private _players: Player[] = [];

  constructor(
    private idGenerator: IdGeneratorStrategy,
  ) { }

  get players(): Player[] {
    return this._players;
  }

  get playerCount(): number {
    return this._players.length;
  }

  createPlayers(configs: PlayerConfig[]) {
    this._players = configs.map((config) => {
      const id = this.idGenerator.generate();
      const hexColor = config.color.startsWith('#') ? config.color : `#${config.color}`;
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);

      return new Player(
        id,
        config.username,
        { r, g, b, hex: hexColor },
      );
    });
  }

  preparePlayersForNewGame() {
    this._players.forEach(player => player.prepareForNewGame());
  }

  resetPlayers() {
    this._players.forEach(player => player.reset());
  }
}
