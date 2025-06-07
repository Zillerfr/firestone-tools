// src/components/Header.tsx
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GuildContext } from '../contexts/GuildContext';
import { FellowshipContext } from '../contexts/FellowshipContext';
import { PlayerContext } from '../contexts/PlayerContext'; // <-- Import du nouveau contexte
import GuildSelectionModal from './GuildSelectionModal';
import FellowshipSelectionModal from './FellowshipSelectionModal';
import PlayerSelectionModal from './PlayerSelectionModal'; // <-- Import de la nouvelle modale
import './Header.css';

const Header: React.FC = () => {
  const { selectedGuildId, setSelectedGuildId } = useContext(GuildContext);
  const { selectedFellowshipId, setSelectedFellowshipId } = useContext(FellowshipContext);
  const { selectedPlayerId, setSelectedPlayerId } = useContext(PlayerContext); // <-- Utilisez le contexte de joueur

  const [isGuildModalOpen, setIsGuildModalOpen] = useState(false);
  const [isFellowshipModalOpen, setIsFellowshipModalOpen] = useState(false);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false); // <-- Nouvel état pour la modale de joueur

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

  // <-- Nouvelle fonction pour la gestion du joueur
  const handlePlayerManagementClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (selectedPlayerId) {
      // Pas besoin de preventDefault
    } else {
      e.preventDefault();
      setIsPlayerModalOpen(true); // Ouvre la modale de sélection de joueur
    }
  };

  // <-- Callback appelé par PlayerSelectionModal
  const onPlayerSelectedFromModal = (playerId: string) => {
    setSelectedPlayerId(playerId); // Met à jour le contexte
    setIsPlayerModalOpen(false); // Ferme la modale
    navigate(`/player-management/${playerId}`); // Navigue vers la page de gestion de joueur
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
          {/* <-- Nouvelle entrée de navigation pour la gestion de joueur */}
          <li>
            <Link
              to={selectedPlayerId ? `/player-management/${selectedPlayerId}` : "#"}
              onClick={handlePlayerManagementClick}
            >
              Gestion de Joueur
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

      {/* <-- Nouvelle Modale de sélection de joueur */}
      <PlayerSelectionModal
        isOpen={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
        onPlayerSelected={onPlayerSelectedFromModal}
      />
    </header>
  );
};

export default Header;