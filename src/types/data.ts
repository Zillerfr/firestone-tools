// src/types/data.ts

export interface Player {
  id: string; // Ajout d'un ID unique pour chaque joueur pour faciliter les opérations CRUD
  name: string;
  role: string; // 'poste' traduit en anglais pour être plus générique
  fellowship: string; // 'confrérie' traduit en anglais
  warCry: number; // 'cri de guerre'
  destiny: number; // 'destin'
  isMember: boolean; // 'membre'
  participation: number; // 'participation' (pourcentage, donc entre 0 et 100)
}

export interface Guild {
  id: string; // Ajout d'un ID unique pour chaque guilde
  name: string;
  players: Player[];
}