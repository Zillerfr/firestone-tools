// src/services/fellowshipService.ts
import type { Fellowship } from '../types/data';
import { playerService } from './playerService'; // Import pour gérer la suppression des affiliations des joueurs

const FELLOWSHIPS_STORAGE_KEY = 'firestone_tools.fellowships';

class FellowshipService {
  /**
   * Charge toutes les confréries depuis le localStorage.
   * @returns Une promesse résolue avec un tableau de Confréries.
   */
  async getAllFellowships(): Promise<Fellowship[]> {
    const data = localStorage.getItem(FELLOWSHIPS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return []; // Retourne un tableau vide si aucune donnée
  }

  /**
   * Sauvegarde un tableau de confréries dans le localStorage.
   * Cette méthode est interne au service.
   * @param fellowships Le tableau de confréries à sauvegarder.
   */
  private async _saveFellowships(fellowships: Fellowship[]): Promise<void> {
    localStorage.setItem(FELLOWSHIPS_STORAGE_KEY, JSON.stringify(fellowships));
  }

  /**
   * Récupère une confrérie par son ID.
   * @param id L'ID de la confrérie.
   * @returns Une promesse résolue avec la Confrérie trouvée, ou undefined.
   */
  async getFellowshipById(id: string): Promise<Fellowship | undefined> {
    const fellowships = await this.getAllFellowships();
    return fellowships.find((fellowship) => fellowship.id === id);
  }

  /**
   * Crée une nouvelle confrérie.
   * @param newFellowshipData Les données de la nouvelle confrérie (sans ID).
   * @returns Une promesse résolue avec la Confrérie créée (avec ID).
   */
  async createFellowship(newFellowshipData: Omit<Fellowship, 'id'>): Promise<Fellowship> {
    const fellowships = await this.getAllFellowships();
    const newFellowship: Fellowship = {
      ...newFellowshipData,
      id: crypto.randomUUID(), // Génère un ID unique
    };
    fellowships.push(newFellowship);
    await this._saveFellowships(fellowships);
    return newFellowship;
  }

  /**
   * Met à jour une confrérie existante.
   * @param id L'ID de la confrérie à mettre à jour.
   * @param updatedData Les données partielles à mettre à jour.
   * @returns Une promesse résolue avec la Confrérie mise à jour, ou undefined si non trouvée.
   */
  async updateFellowship(id: string, updatedData: Partial<Fellowship>): Promise<Fellowship | undefined> {
    let fellowships = await this.getAllFellowships();
    const index = fellowships.findIndex((fellowship) => fellowship.id === id);

    if (index !== -1) {
      fellowships[index] = { ...fellowships[index], ...updatedData };
      await this._saveFellowships(fellowships);
      return fellowships[index];
    }
    return undefined; // Confrérie non trouvée
  }

  /**
   * Supprime une confrérie par son ID.
   * @param id L'ID de la confrérie à supprimer.
   * @returns Une promesse résolue avec true si supprimée, false sinon.
   */
  async deleteFellowship(id: string): Promise<boolean> {
    let fellowships = await this.getAllFellowships();
    const initialLength = fellowships.length;
    fellowships = fellowships.filter((fellowship) => fellowship.id !== id);
    if (fellowships.length < initialLength) {
      await this._saveFellowships(fellowships);
      // IMPORTRANT : Réinitialiser l'ID de confrérie pour tous les joueurs qui appartenaient à cette confrérie.
      await playerService.resetFellowshipAffiliations(id);
      return true; // Confrérie supprimée
    }
    return false; // Confrérie non trouvée
  }

  // Les méthodes addPlayerIdToFellowship et removePlayerIdFromFellowship ont été supprimées
  // car l'appartenance du joueur est gérée directement sur l'objet Player.
}

// Exportez une instance unique du service
export const fellowshipService = new FellowshipService();