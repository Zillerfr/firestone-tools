// src/types/data.ts

export interface Player {
  id: string;
  name: string;
  role: string;
  warCry: number;
  destiny: number;
  participation: number;
  guildId: string | null;
  fellowshipId: string | null;
  // Optionnel: Ajouter directement l'objet Guild et Fellowship si les données sont "jointes" côté backend ou dans le service.
  // Pour cet exercice, nous allons faire la jointure côté front-end si nécessaire.
  guild?: Guild; // Ajouté pour potentiellement embarquer les données de la guilde
}

export interface Guild {
  id: string; // ID unique pour chaque guilde
  name: string;
}

export interface Fellowship {
  id: string; // ID unique pour chaque confrérie
  name: string;
}