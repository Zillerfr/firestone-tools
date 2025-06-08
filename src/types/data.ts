// src/types/data.ts

export interface Player {
  id: string;
  name: string;
  role: string;
  warCry: number;
  destiny: number;
  guildId: string | null;
  fellowshipId: string | null;
  guild?: Guild | null; // Ajouté pour potentiellement embarquer les données de la guilde
  fellowship?: Fellowship | null; // Ajouté pour potentiellement embarquer les données de la confrérie
}

export interface Guild {
  id: string; // ID unique pour chaque guilde
  name: string;
}

export interface Fellowship {
  id: string; // ID unique pour chaque confrérie
  name: string;
}