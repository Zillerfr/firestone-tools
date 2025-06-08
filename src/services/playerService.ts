// src/services/playerService.ts
import type { Player } from '../types/data'; // Assurez-vous que l'interface Player est bien importée

// Utilisation de crypto.randomUUID() pour générer des IDs uniques
// Assurez-vous que cette fonction est disponible dans votre environnement (navigateurs modernes)
// Si vous ciblez des environnements plus anciens, vous devrez peut-être utiliser une bibliothèque comme 'uuid'
// comme vous l'avez fait précédemment (import { v4 as uuidv4 } from 'uuid';)
// Pour la conformité avec l'exemple fourni, nous allons utiliser crypto.randomUUID().

const PLAYERS_STORAGE_KEY = 'firestone_tools.players';

class PlayerService {
  /**
   * Charge tous les joueurs depuis le localStorage.
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
   * @param newPlayerData Les données du nouveau joueur (sans ID).
   * @returns Une promesse résolue avec le Joueur créé (avec ID).
   */
  async createPlayer(newPlayerData: Omit<Player, 'id'>): Promise<Player> {
    const players = await this.getAllPlayers();
    const newPlayer: Player = {
      ...newPlayerData,
      id: crypto.randomUUID(), // Génère un ID unique
    };
    players.push(newPlayer);
    await this._savePlayers(players);
    return newPlayer;
  }

  /**
   * Met à jour un joueur existant.
   * @param id L'ID du joueur à mettre à jour.
   * @param updatedData Les données partielles à mettre à jour.
   * @returns Une promesse résolue avec le Joueur mis à jour, ou undefined si non trouvé.
   */
  async updatePlayer(id: string, updatedData: Partial<Omit<Player, 'id'>>): Promise<Player | undefined> {
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
    if (players.length < initialLength) {
      await this._savePlayers(players);
      return true; // Joueur supprimé
    }
    return false; // Joueur non trouvé
  }

  /**
   * Réinitialise l'affiliation à une guilde spécifique pour tous les joueurs.
   * Utile lors de la suppression d'une guilde.
   * @param guildId L'ID de la guilde dont l'affiliation doit être retirée.
   */
  async resetGuildAffiliations(guildId: string): Promise<void> {
    let players = await this.getAllPlayers();
    const playersToUpdate = players.filter(player => player.guildId === guildId);

    if (playersToUpdate.length > 0) {
      players = players.map(player =>
        player.guildId === guildId ? { ...player, guildId: null } : player
      );
      await this._savePlayers(players);
    }
  }

  /**
   * Réinitialise l'affiliation à une confrérie spécifique pour tous les joueurs.
   * Utile lors de la suppression d'une confrérie.
   * @param fellowshipId L'ID de la confrérie dont l'affiliation doit être retirée.
   */
  async resetFellowshipAffiliations(fellowshipId: string): Promise<void> {
    let players = await this.getAllPlayers();
    const playersToUpdate = players.filter(player => player.fellowshipId === fellowshipId);

    if (playersToUpdate.length > 0) {
      players = players.map(player =>
        player.fellowshipId === fellowshipId ? { ...player, fellowshipId: null } : player
      );
      await this._savePlayers(players);
    }
  }
}

// Exportez une instance unique du service
export const playerService = new PlayerService();