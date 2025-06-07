// src/App.tsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import GuildManagement from './pages/GuildManagement';
import AccountManagement from './pages/AccountManagement';
import './App.css';
import { GuildContext } from './contexts/GuildContext';

// Nouveau composant interne pour gérer la classe de main
const MainContentWrapper: React.FC = () => {
  const location = useLocation(); // Maintenant, useLocation est dans le contexte du Router

  // Déterminez la classe CSS basée sur la route
  const mainContentClass = location.pathname === '/' ? 'main-content-centered' : 'main-content-top';

  return (
    <main className={mainContentClass}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/guild-management/:guildId" element={<GuildManagement />} />
        <Route path="/account-management" element={<AccountManagement />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
};

const App: React.FC = () => {
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null);

  return (
    <GuildContext.Provider value={{ selectedGuildId, setSelectedGuildId }}>
      <Router basename="/firestone-tools/">
        <Header />
        {/* Le MainContentWrapper est rendu à l'intérieur du Router */}
        <MainContentWrapper />
      </Router>
    </GuildContext.Provider>
  );
};

export default App;