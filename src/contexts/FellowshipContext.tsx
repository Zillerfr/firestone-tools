// src/contexts/FellowshipContext.tsx
import React, { createContext } from 'react';

// Définir l'interface pour les propriétés du Contexte des Confréries
interface FellowshipContextProps {
  selectedFellowshipId: string | null;
  setSelectedFellowshipId: React.Dispatch<React.SetStateAction<string | null>>;
}

// Créer le Contexte des Confréries avec des valeurs par défaut
// Ces valeurs par défaut seront utilisées si le Contexte n'est pas fourni par un Provider en amont
export const FellowshipContext = createContext<FellowshipContextProps>({
  selectedFellowshipId: null,
  setSelectedFellowshipId: () => {}, // Fonction vide par défaut
});

// NOTE : Vous devrez envelopper votre application (ou la partie pertinente)
// avec un FellowshipProvider pour que le Contexte soit réellement fonctionnel.
// Par exemple, dans votre App.tsx ou index.tsx, comme vous le faites pour GuildContext.