// Importez BrowserRouter, Routes, Route
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // <--- Ajoutez Navigate
import Header from './components/Header';
import Home from './pages/Home';
import GuildManagement from './pages/GuildManagement';
import AccountManagement from './pages/AccountManagement';
import './App.css';

function App() {
  // Le basename doit correspondre au base de vite.config.ts (nom du dépôt)
  const basename = "/firestone-tools";

  return (
    // Utilisez la prop basename dans BrowserRouter
    <Router basename={basename}>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} /> 
          <Route path="/guild-management" element={<GuildManagement />} />
          <Route path="/account-management" element={<AccountManagement />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;