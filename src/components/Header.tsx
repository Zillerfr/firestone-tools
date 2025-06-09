import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GuildContext } from '../contexts/GuildContext';
import { FellowshipContext } from '../contexts/FellowshipContext';
import GuildSelectionModal from './GuildSelectionModal';
import FellowshipSelectionModal from './FellowshipSelectionModal';
import './Header.css';

const Header: React.FC = () => {
  const { selectedGuildId, setSelectedGuildId } = useContext(GuildContext);
  const { selectedFellowshipId, setSelectedFellowshipId } = useContext(FellowshipContext);

  const [isGuildModalOpen, setIsGuildModalOpen] = useState(false);
  const [isFellowshipModalOpen, setIsFellowshipModalOpen] = useState(false);

  const navigate = useNavigate();

  const handleGuildManagementClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (selectedGuildId) {
      // Pas besoin de preventDefault
    } else {
      e.preventDefault();
      setIsGuildModalOpen(true);
    }
  };

  const onGuildSelectedFromModal = (guildId: string) => {
    setSelectedGuildId(guildId);
    setIsGuildModalOpen(false);
    navigate(`/guild-management/${guildId}`);
  };

  const handleFellowshipManagementClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (selectedFellowshipId) {
      // Pas besoin de preventDefault
    } else {
      e.preventDefault();
      setIsFellowshipModalOpen(true);
    }
  };

  const onFellowshipSelectedFromModal = (fellowshipId: string) => {
    setSelectedFellowshipId(fellowshipId);
    setIsFellowshipModalOpen(false);
    navigate(`/fellowship-management/${fellowshipId}`);
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
              to={selectedGuildId ? `/guild-management/${selectedGuildId}` : "#"}
              onClick={handleGuildManagementClick}
            >
              Gestion de Guilde
            </Link>
          </li>
          <li>
            <Link
              to={selectedFellowshipId ? `/fellowship-management/${selectedFellowshipId}` : "#"}
              onClick={handleFellowshipManagementClick}
            >
              Gestion de Confrérie
            </Link>
          </li>
          <li>
            <Link to="/player-management">
              Gestion des Joueurs
            </Link>
          </li>
        </ul>
      </nav>

      {/* Modale de sélection de guilde */}
      <GuildSelectionModal
        isOpen={isGuildModalOpen}
        onClose={() => setIsGuildModalOpen(false)}
        onGuildSelected={onGuildSelectedFromModal}
      />

      {/* Modale de sélection de confrérie */}
      <FellowshipSelectionModal
        isOpen={isFellowshipModalOpen}
        onClose={() => setIsFellowshipModalOpen(false)}
        onFellowshipSelected={onFellowshipSelectedFromModal}
      />

    </header>
  );
};

export default Header;