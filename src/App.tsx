// src/App.tsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import GuildManagement from './pages/GuildManagement';
import FellowshipManagement from './pages/FellowshipManagement';
import PlayerManagement from './pages/PlayerManagement'; // <-- Import de la nouvelle page
import AccountManagement from './pages/AccountManagement';
import './App.css';
import { GuildContext } from './contexts/GuildContext';
import { FellowshipContext } from './contexts/FellowshipContext';
import { PlayerContext } from './contexts/PlayerContext'; // <-- Import du nouveau contexte

// Nouveau composant interne pour gérer la classe de main
const MainContentWrapper: React.FC = () => {
  const location = useLocation();

  // Déterminez la classe CSS basée sur la route
  const mainContentClass = location.pathname === '/' ? 'main-content-centered' : 'main-content-top';

  return (
    <main className={mainContentClass}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/guild-management/:guildId" element={<GuildManagement />} /> 
        <Route path="/fellowship-management/:fellowshipId" element={<FellowshipManagement />} />
        {/* <-- Nouvelle route pour la gestion de joueur */}
        <Route path="/player-management/:playerId" element={<PlayerManagement />} />
        <Route path="/account-management" element={<AccountManagement />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
};

const App: React.FC = () => {
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null);
  const [selectedFellowshipId, setSelectedFellowshipId] = useState<string | null>(null);
  // <-- Ajoutez l'état pour l'ID du joueur sélectionné
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  return (
    // <-- Imbriquez les trois contextes pour qu'ils soient disponibles dans toute l'application
    <GuildContext.Provider value={{ selectedGuildId, setSelectedGuildId }}>
      <FellowshipContext.Provider value={{ selectedFellowshipId, setSelectedFellowshipId }}>
        <PlayerContext.Provider value={{ selectedPlayerId, setSelectedPlayerId }}> {/* <-- Nouveau Provider */}
          <Router basename="/firestone-tools/">
            <Header />
            <MainContentWrapper />
          </Router>
        </PlayerContext.Provider>
      </FellowshipContext.Provider>
    </GuildContext.Provider>
  );
};

export default App;