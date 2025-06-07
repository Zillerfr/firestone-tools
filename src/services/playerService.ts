// src/services/playerService.ts
import type { Player } from '../types/data';

const PLAYERS_STORAGE_KEY = 'firestone_tools.players';

class PlayerService {
  /**
   * Charge tous les joueurs enregistrés depuis le localStorage.
   * @returns Une promesse résolue avec un tableau de Joueurs.
   */
  async getAllPlayers(): Promise<Player[]> {
    const data = localStorage.getItem(PLAYERS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return []; // Retourne un tableau vide si aucune donnée
  }

  /**
   * Sauvegarde un tableau de joueurs dans le localStorage.
   * Cette méthode est interne au service.
   * @param players Le tableau de joueurs à sauvegarder.
   */
  private async _savePlayers(players: Player[]): Promise<void> {
    localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(players));
  }

  /**
   * Récupère un joueur par son ID.
   * @param id L'ID du joueur.
   * @returns Une promesse résolue avec le Joueur trouvé, ou undefined.
   */
  async getPlayerById(id: string): Promise<Player | undefined> {
    const players = await this.getAllPlayers();
    return players.find((player) => player.id === id);
  }

  /**
   * Crée un nouveau joueur.
   * @param newPlayerData Les données du nouveau joueur (sans ID, mais peut inclure guildId/fellowshipId).
   * @returns Une promesse résolue avec le Joueur créé (avec ID).
   */
  async createPlayer(newPlayerData: Omit<Player, 'id'>): Promise<Player> {
    const players = await this.getAllPlayers();
    const newPlayer: Player = {
      ...newPlayerData,
      id: crypto.randomUUID(), // Génère un ID unique
      // S'assurer que guildId/fellowshipId sont bien initialisés même s'ils sont absents de newPlayerData
      guildId: newPlayerData.guildId === undefined ? null : newPlayerData.guildId,
      fellowshipId: newPlayerData.fellowshipId === undefined ? null : newPlayerData.fellowshipId,
    };
    players.push(newPlayer);
    await this._savePlayers(players);
    return newPlayer;
  }

  /**
   * Met à jour un joueur existant.
   * @param id L'ID du joueur à mettre à jour.
   * @param updatedData Les données partielles à mettre à jour (peut inclure guildId/fellowshipId).
   * @returns Une promesse résolue avec le Joueur mis à jour, ou undefined si non trouvé.
   */
  async updatePlayer(id: string, updatedData: Partial<Player>): Promise<Player | undefined> {
    let players = await this.getAllPlayers();
    const index = players.findIndex((player) => player.id === id);

    if (index !== -1) {
      players[index] = { ...players[index], ...updatedData };
      await this._savePlayers(players);
      return players[index];
    }
    return undefined; // Joueur non trouvé
  }

  /**
   * Supprime un joueur par son ID.
   * @param id L'ID du joueur à supprimer.
   * @returns Une promesse résolue avec true si supprimé, false sinon.
   */
  async deletePlayer(id: string): Promise<boolean> {
    let players = await this.getAllPlayers();
    const initialLength = players.length;
    players = players.filter((player) => player.id !== id);
    await this._savePlayers(players);
    return players.length < initialLength; // True si un joueur a été supprimé
  }

  /**
   * Réinitialise les affiliations de guilde pour les joueurs d'une guilde supprimée.
   * @param guildId L'ID de la guilde supprimée.
   */
  async resetGuildAffiliations(guildId: string): Promise<void> {
    let players = await this.getAllPlayers();
    let changed = false;
    players = players.map(player => {
        if (player.guildId === guildId) {
            changed = true;
            return { ...player, guildId: null };
        }
        return player;
    });
    if (changed) {
        await this._savePlayers(players);
    }
  }

  /**
   * Réinitialise les affiliations de confrérie pour les joueurs d'une confrérie supprimée.
   * @param fellowshipId L'ID de la confrérie supprimée.
   */
  async resetFellowshipAffiliations(fellowshipId: string): Promise<void> {
    let players = await this.getAllPlayers();
    let changed = false;
    players = players.map(player => {
        if (player.fellowshipId === fellowshipId) {
            changed = true;
            return { ...player, fellowshipId: null };
        }
        return player;
    });
    if (changed) {
        await this._savePlayers(players);
    }
  }

}

// Exportez une instance unique du service
export const playerService = new PlayerService();