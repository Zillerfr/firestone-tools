import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import GuildManagement from './pages/GuildManagement';
import AccountManagement from './pages/AccountManagement';
import './App.css';

const App: React.FC = () => {
  const basename = "/firestone-tools"; // Assurez-vous que c'est le même que dans vite.config.ts

  return (
    <Router basename={basename}>
      <Header />
      <main>
        <Routes>
          {/* Routes normales de votre application */}
          <Route path="/" element={<Home />} />
          <Route path="/guild-management" element={<GuildManagement />} />
          <Route path="/account-management" element={<AccountManagement />} />

          {/* !!! NOUVEAUTÉ : Route de redirection "catch-all" !!! */}
          {/* Si aucune des routes précédentes ne correspond, celle-ci s'active */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </Router>
  );
};

export default App;