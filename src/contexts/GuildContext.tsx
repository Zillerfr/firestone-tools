// src/contexts/GuildContext.tsx
import React, { createContext } from 'react';

interface GuildContextProps {
  selectedGuildId: string | null;
  setSelectedGuildId: React.Dispatch<React.SetStateAction<string | null>>;
}

export const GuildContext = createContext<GuildContextProps>({
  selectedGuildId: null,
  setSelectedGuildId: () => {}, // Fonction vide par défaut
});