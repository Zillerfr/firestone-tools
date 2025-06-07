// src/services/guildService.ts
import type { Guild } from '../types/data'; // Supprimer 'Player' et 'Fellowship' car elles ne sont plus nécessaires directement ici
import { playerService } from './playerService'; // Import pour gérer la suppression des affiliations des joueurs

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
  async createGuild(newGuildData: Omit<Guild, 'id'>): Promise<Guild> {
    const guilds = await this.getAllGuilds();
    const newGuild: Guild = {
      ...newGuildData,
      id: crypto.randomUUID(), // Génère un ID unique
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
    if (guilds.length < initialLength) {
      await this._saveGuilds(guilds);
      // IMPORTRANT : Réinitialiser l'ID de guilde pour tous les joueurs qui appartenaient à cette guilde.
      await playerService.resetGuildAffiliations(id);
      return true; // Guilde supprimée
    }
    return false; // Guilde non trouvée
  }

  // Les méthodes addPlayerIdToGuild et removePlayerIdFromGuild ont été supprimées
  // car l'appartenance du joueur est gérée directement sur l'objet Player.
}

// Exportez une instance unique du service
export const guildService = new GuildService();