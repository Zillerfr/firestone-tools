// src/services/guildService.ts
import type { Guild, Player } from '../types/data';

const GUILDS_STORAGE_KEY = 'firestone_tools.guilds';

class GuildService {
  /**
   * Charge toutes les guildes depuis le localStorage.
   * @returns Une promesse résolue avec un tableau de Guildes.
   */
  async getAllGuilds(): Promise<Guild[]> {
    const data = localStorage.getItem(GUILDS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return []; // Retourne un tableau vide si aucune donnée
  }

  /**
   * Sauvegarde un tableau de guildes dans le localStorage.
   * Cette méthode est interne au service.
   * @param guilds Le tableau de guildes à sauvegarder.
   */
  private async _saveGuilds(guilds: Guild[]): Promise<void> {
    localStorage.setItem(GUILDS_STORAGE_KEY, JSON.stringify(guilds));
  }

  /**
   * Récupère une guilde par son ID.
   * @param id L'ID de la guilde.
   * @returns Une promesse résolue avec la Guilde trouvée, ou undefined.
   */
  async getGuildById(id: string): Promise<Guild | undefined> {
    const guilds = await this.getAllGuilds();
    return guilds.find((guild) => guild.id === id);
  }

  /**
   * Crée une nouvelle guilde.
   * @param newGuildData Les données de la nouvelle guilde (sans ID).
   * @returns Une promesse résolue avec la Guilde créée (avec ID).
   */
  async createGuild(newGuildData: Omit<Guild, 'id' | 'players'>): Promise<Guild> {
    const guilds = await this.getAllGuilds();
    const newGuild: Guild = {
      ...newGuildData,
      id: crypto.randomUUID(), // Génère un ID unique
      players: [], // Nouvelle guilde commence sans joueurs
    };
    guilds.push(newGuild);
    await this._saveGuilds(guilds);
    return newGuild;
  }

  /**
   * Met à jour une guilde existante.
   * @param id L'ID de la guilde à mettre à jour.
   * @param updatedData Les données partielles à mettre à jour.
   * @returns Une promesse résolue avec la Guilde mise à jour, ou undefined si non trouvée.
   */
  async updateGuild(id: string, updatedData: Partial<Guild>): Promise<Guild | undefined> {
    let guilds = await this.getAllGuilds();
    const index = guilds.findIndex((guild) => guild.id === id);

    if (index !== -1) {
      guilds[index] = { ...guilds[index], ...updatedData };
      await this._saveGuilds(guilds);
      return guilds[index];
    }
    return undefined; // Guilde non trouvée
  }

  /**
   * Supprime une guilde par son ID.
   * @param id L'ID de la guilde à supprimer.
   * @returns Une promesse résolue avec true si supprimée, false sinon.
   */
  async deleteGuild(id: string): Promise<boolean> {
    let guilds = await this.getAllGuilds();
    const initialLength = guilds.length;
    guilds = guilds.filter((guild) => guild.id !== id);
    await this._saveGuilds(guilds);
    return guilds.length < initialLength; // True si une guilde a été supprimée
  }

  /**
   * Ajoute un joueur à une guilde.
   * @param guildId L'ID de la guilde.
   * @param player Data du nouveau joueur (sans ID).
   * @returns Promesse résolue avec le joueur ajouté, ou undefined si la guilde n'existe pas.
   */
  async addPlayerToGuild(guildId: string, newPlayerData: Omit<Player, 'id'>): Promise<Player | undefined> {
    const guilds = await this.getAllGuilds();
    const guildIndex = guilds.findIndex((g) => g.id === guildId);

    if (guildIndex !== -1) {
      const newPlayer: Player = {
        ...newPlayerData,
        id: crypto.randomUUID(),
      };
      guilds[guildIndex].players.push(newPlayer);
      await this._saveGuilds(guilds);
      return newPlayer;
    }
    return undefined; // Guilde non trouvée
  }

  /**
   * Met à jour un joueur dans une guilde.
   * @param guildId L'ID de la guilde.
   * @param playerId L'ID du joueur à mettre à jour.
   * @param updatedData Les données partielles à mettre à jour.
   * @returns Promesse résolue avec le joueur mis à jour, ou undefined.
   */
  async updatePlayerInGuild(
    guildId: string,
    playerId: string,
    updatedData: Partial<Player>
  ): Promise<Player | undefined> {

    const guilds = await this.getAllGuilds();
    const guildIndex = guilds.findIndex((g) => g.id === guildId);

    if (guildIndex !== -1) {
      const playerIndex = guilds[guildIndex].players.findIndex((p) => p.id === playerId);
      if (playerIndex !== -1) {
        guilds[guildIndex].players[playerIndex] = {
          ...guilds[guildIndex].players[playerIndex],
          ...updatedData,
        };
        await this._saveGuilds(guilds);
        return guilds[guildIndex].players[playerIndex];
      }
    }
    return undefined; // Guilde ou joueur non trouvé
  }

  /**
   * Supprime un joueur d'une guilde.
   * @param guildId L'ID de la guilde.
   * @param playerId L'ID du joueur à supprimer.
   * @returns Promesse résolue avec true si supprimé, false sinon.
   */
  async deletePlayerFromGuild(guildId: string, playerId: string): Promise<boolean> {

    const guilds = await this.getAllGuilds();
    const guildIndex = guilds.findIndex((g) => g.id === guildId);

    if (guildIndex !== -1) {
      const initialPlayerCount = guilds[guildIndex].players.length;
      guilds[guildIndex].players = guilds[guildIndex].players.filter((p) => p.id !== playerId);
      if (guilds[guildIndex].players.length < initialPlayerCount) {
        await this._saveGuilds(guilds);
        return true; // Joueur supprimé
      }
    }
    return false; // Guilde ou joueur non trouvé
  }
}

// Exportez une instance unique du service
export const guildService = new GuildService();