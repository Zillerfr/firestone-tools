// src/contexts/PlayerContext.tsx
import React, { createContext } from 'react';

// Définir l'interface pour les propriétés du Contexte des Joueurs
interface PlayerContextProps {
  selectedPlayerId: string | null;
  setSelectedPlayerId: React.Dispatch<React.SetStateAction<string | null>>;
}

// Créer le Contexte des Joueurs avec des valeurs par défaut
export const PlayerContext = createContext<PlayerContextProps>({
  selectedPlayerId: null,
  setSelectedPlayerId: () => {}, // Fonction vide par défaut
});