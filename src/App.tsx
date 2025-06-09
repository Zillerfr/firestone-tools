// src/App.tsx
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import GuildManagement from './pages/GuildManagement';
import FellowshipManagement from './pages/FellowshipManagement';
import PlayerManagement from './pages/PlayerManagement';
import AccountManagement from './pages/AccountManagement';
import './App.css';
import { GuildContext } from './contexts/GuildContext';
import { FellowshipContext } from './contexts/FellowshipContext';
import Footer from './components/Footer';
import DataManagement from './pages/DataManagement';
import ChaosRiftLoot from './pages/ChaosRiftLoot';

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
        <Route path="/player-management" element={<PlayerManagement />} />
        <Route path="/account-management" element={<AccountManagement />} />
        <Route path="/data-management" element={<DataManagement />} />
        <Route path="/chaos-rift-loot/:guildId" element={<ChaosRiftLoot />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
};

const App: React.FC = () => {
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null);
  const [selectedFellowshipId, setSelectedFellowshipId] = useState<string | null>(null);
  const basename = process.env.NODE_ENV === 'production' ? '/firestone-tools/' : '';

  return (
    <GuildContext.Provider value={{ selectedGuildId, setSelectedGuildId }}>
      <FellowshipContext.Provider value={{ selectedFellowshipId, setSelectedFellowshipId }}>
          <Router basename={basename}>
            <Header />
            <MainContentWrapper />
            <Footer />
          </Router>
      </FellowshipContext.Provider>
    </GuildContext.Provider>
  );
};

export default App;