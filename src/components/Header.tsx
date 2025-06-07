// src/components/Header.tsx
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GuildContext } from '../contexts/GuildContext';
import { FellowshipContext } from '../contexts/FellowshipContext'; // <-- Import du nouveau contexte
import GuildSelectionModal from './GuildSelectionModal';
import FellowshipSelectionModal from './FellowshipSelectionModal'; // <-- Import de la nouvelle modale
import './Header.css';

const Header: React.FC = () => {
  const { selectedGuildId, setSelectedGuildId } = useContext(GuildContext);
  // <-- Utilisez le contexte de confrérie
  const { selectedFellowshipId, setSelectedFellowshipId } = useContext(FellowshipContext);

  const [isGuildModalOpen, setIsGuildModalOpen] = useState(false); // Renommé pour clarté
  // <-- Nouvel état pour la modale de sélection de confrérie
  const [isFellowshipModalOpen, setIsFellowshipModalOpen] = useState(false);

  const navigate = useNavigate();

  const handleGuildManagementClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (selectedGuildId) {
      // Le Link va naviguer, pas besoin de preventDefault
    } else {
      e.preventDefault(); // Empêche la navigation par défaut
      setIsGuildModalOpen(true); // Ouvre la modale de sélection de guilde
    }
  };

  // Callback appelé par GuildSelectionModal
  const onGuildSelectedFromModal = (guildId: string) => {
    setSelectedGuildId(guildId); // Met à jour le contexte
    setIsGuildModalOpen(false); // Ferme la modale
    navigate(`/guild-management/${guildId}`); // Navigue
  };

  // <-- Nouvelle fonction pour la gestion de la confrérie
  const handleFellowshipManagementClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (selectedFellowshipId) {
      // Si une confrérie est déjà sélectionnée, on laisse le Link naviguer.
      // Il faut définir une route pour la gestion de confrérie si ce n'est pas déjà fait.
      // Pour l'instant, on va naviguer vers /fellowship-management/${selectedFellowshipId}
      // N'oubliez pas d'ajouter cette route dans App.tsx !
    } else {
      e.preventDefault(); // Empêche la navigation par défaut
      setIsFellowshipModalOpen(true); // Ouvre la modale de sélection de confrérie
    }
  };

  // <-- Callback appelé par FellowshipSelectionModal
  const onFellowshipSelectedFromModal = (fellowshipId: string) => {
    setSelectedFellowshipId(fellowshipId); // Met à jour le contexte
    setIsFellowshipModalOpen(false); // Ferme la modale
    navigate(`/fellowship-management/${fellowshipId}`); // Navigue vers la page de gestion de confrérie
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
          {/* <-- Nouvelle entrée de navigation pour la gestion de confrérie */}
          <li>
            <Link
              to={selectedFellowshipId ? `/fellowship-management/${selectedFellowshipId}` : "#"}
              onClick={handleFellowshipManagementClick}
            >
              Gestion de Confrérie
            </Link>
          </li>
          {/* L'ancienne "Gestion de Compte" est supprimée selon la demande */}
          {/* <li>
            <Link to="/account-management">Gestion de Compte</Link>
          </li> */}
        </ul>
      </nav>

      {/* Modale de sélection de guilde */}
      <GuildSelectionModal
        isOpen={isGuildModalOpen}
        onClose={() => setIsGuildModalOpen(false)}
        onGuildSelected={onGuildSelectedFromModal}
      />

      {/* <-- Nouvelle Modale de sélection de confrérie */}
      <FellowshipSelectionModal
        isOpen={isFellowshipModalOpen}
        onClose={() => setIsFellowshipModalOpen(false)}
        onFellowshipSelected={onFellowshipSelectedFromModal}
      />
    </header>
  );
};

export default Header;