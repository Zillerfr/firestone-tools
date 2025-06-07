// src/components/Header.tsx
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GuildContext } from '../contexts/GuildContext';
import GuildSelectionModal from './GuildSelectionModal';
import './Header.css';

const Header: React.FC = () => {
  const { selectedGuildId, setSelectedGuildId } = useContext(GuildContext); // Utilisez le contexte
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleGuildManagementClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Si une guilde est déjà sélectionnée dans le contexte global, on laisse le Link naviguer
    if (selectedGuildId) {
      // Le Link va naviguer vers `/guild-management/${selectedGuildId}`
      // Pas besoin de e.preventDefault() ici car le Link a déjà sa destination correcte.
    } else {
      // Si aucune guilde n'est sélectionnée globalement, on empêche la navigation du Link
      // et on affiche la popin de sélection.
      e.preventDefault();
      setIsModalOpen(true);
    }
  };

  // Callback appelé par GuildSelectionModal quand l'utilisateur a fait un choix et validé.
  const onGuildSelectedFromModal = (guildId: string) => {
    setSelectedGuildId(guildId); // Met à jour le contexte avec la guilde choisie dans la popin
    setIsModalOpen(false); // Ferme la popin
    navigate(`/guild-management/${guildId}`); // Navigue vers la page de gestion de guilde
  };

  return (
    <header className="app-header">
      <nav>
        <ul className="nav-left">
          <li>
            <Link to="/">Accueil</Link>
          </li>
        </ul>

        <ul className="nav-right">
          <li>
            <Link
              // La destination du Link est dynamique: vers la guilde sélectionnée ou '#' si aucune
              to={selectedGuildId ? `/guild-management/${selectedGuildId}` : "#"}
              onClick={handleGuildManagementClick}
            >
              Gestion de Guilde
            </Link>
          </li>
          <li>
            <Link to="/account-management">Gestion de Compte</Link>
          </li>
        </ul>
      </nav>

      <GuildSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGuildSelected={onGuildSelectedFromModal}
      />
    </header>
  );
};

export default Header;