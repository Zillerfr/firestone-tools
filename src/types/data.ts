// src/types/data.ts

export interface Player {
  id: string; // ID unique pour chaque joueur
  name: string;
  role: string; // 'poste'
  warCry: number; // 'cri de guerre'
  destiny: number; // 'destin'
  isMember: boolean; // 'membre'
  participation: number; // 'participation' (pourcentage, donc entre 0 et 100)
  // NOUVELLES PROPRIÉTÉS : ID de la guilde et de la confrérie auxquelles le joueur appartient
  guildId: string | null;     // ID de la guilde, ou null si aucune
  fellowshipId: string | null; // ID de la confrérie, ou null si aucune
}

export interface Guild {
  id: string; // ID unique pour chaque guilde
  name: string;
  // MODIFIÉ : Suppression de 'playerIds'
}

export interface Fellowship {
  id: string; // ID unique pour chaque confrérie
  name: string;
  // MODIFIÉ : Suppression de 'playerIds'
}