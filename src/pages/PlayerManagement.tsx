// src/pages/PlayerManagement.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Seulement useNavigate, plus besoin de Link
import { playerService } from '../services/playerService';
import { guildService } from '../services/guildService';
import { fellowshipService } from '../services/fellowshipService';
import ConfirmationModal from '../components/ConfirmationModal';
import PlayerCreationModal from '../components/PlayerCreationModal';
import type { Guild, Fellowship, Player } from '../types/data';
import './PageStyles.css';

type SortKey = keyof Player | 'guildName' | 'fellowshipName';
type SortDirection = 'asc' | 'desc';

const PlayerManagement: React.FC = () => {
  const navigate = useNavigate();

  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [fellowships, setFellowships] = useState<Fellowship[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);

  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState<boolean>(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);

  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedPlayers, fetchedGuilds, fetchedFellowships] = await Promise.all([
        playerService.getAllPlayers(),
        guildService.getAllGuilds(),
        fellowshipService.getAllFellowships(),
      ]);
      setAllPlayers(fetchedPlayers);
      setGuilds(fetchedGuilds);
      setFellowships(fetchedFellowships);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Impossible de charger les joueurs, guildes ou confréries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const getGuildName = (guildId: string | null) => {
    if (!guildId) return 'N/A';
    const guild = guilds.find(g => g.id === guildId);
    return guild ? guild.name : 'Inconnue';
  };

  const getFellowshipName = (fellowshipId: string | null) => {
    if (!fellowshipId) return 'N/A';
    const fellowship = fellowships.find(f => f.id === fellowshipId);
    return fellowship ? fellowship.name : 'Inconnue';
  };

  const formatNumberForDisplay = useCallback((num: number): string => {
    if (num === null || isNaN(num)) return '0';
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }, []);

  const sortedPlayers = React.useMemo(() => {
    let sortableItems = [...allPlayers];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'guildName') {
          aValue = getGuildName(a.guildId);
          bValue = getGuildName(b.guildId);
        } else if (sortConfig.key === 'fellowshipName') {
          aValue = getFellowshipName(a.fellowshipId);
          bValue = getFellowshipName(b.fellowshipId);
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc'
            ? aValue - bValue
            : bValue - aValue;
        }
        if (aValue === null || aValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
        if (bValue === null || bValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;

        return 0;
      });
    }
    return sortableItems;
  }, [allPlayers, sortConfig, guilds, fellowships, getGuildName, getFellowshipName]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return '-';
    }
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  const handleAddPlayerClick = () => {
    setPlayerToEdit(null);
    setIsPlayerModalOpen(true);
  };

  const handleEditPlayerClick = (player: Player) => {
    setPlayerToEdit(player);
    setIsPlayerModalOpen(true);
  };

  const handlePlayerCreationOrUpdate = async (player: Player) => {
    setIsPlayerModalOpen(false);
    setPlayerToEdit(null);
    await loadAllData();
  };

  const handleDeletePlayerClick = (player: Player) => {
    setPlayerToDelete(player);
    setIsDeleteModalOpen(true);
  };

  const confirmDeletePlayer = async () => {
    if (playerToDelete) {
      try {
        await playerService.deletePlayer(playerToDelete.id);
        console.log(`Joueur ${playerToDelete.name} supprimé avec succès.`);
        setIsDeleteModalOpen(false);
        setPlayerToDelete(null);
        await loadAllData();
      } catch (err) {
        console.error('Erreur lors de la suppression du joueur:', err);
        setError('Impossible de supprimer le joueur.');
      }
    }
  };

  // Nouvelle fonction pour naviguer vers la page de gestion de guilde
  const handleViewGuild = (guildId: string) => {
    navigate(`/guild-management/${guildId}`);
  };

  // Nouvelle fonction pour naviguer vers la page de gestion de confrérie
  const handleViewFellowship = (fellowshipId: string) => {
    navigate(`/fellowship-management/${fellowshipId}`);
  };

  if (loading) {
    return <p className="loading-message">Chargement des joueurs...</p>;
  }

  if (error) {
    return <p className="error-message">Erreur: {error}</p>;
  }

  return (
    <div className="page-container">
      <div className="entity-header-row">
        <h2 className="entity-title">Gestion des Joueurs</h2>
        <button onClick={handleAddPlayerClick} className="add-button">
          Ajouter un joueur
        </button>
      </div>

      <div className="table-container">
        {allPlayers.length === 0 ? (
          <p>Aucun joueur disponible. Cliquez sur "Ajouter un joueur" pour en créer un.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => requestSort('name')}>
                  Nom du Joueur <span className="sort-indicator">{getSortIndicator('name')}</span>
                </th>
                <th onClick={() => requestSort('guildName')}>
                  Nom de Guilde <span className="sort-indicator">{getSortIndicator('guildName')}</span>
                </th>
                <th onClick={() => requestSort('role')}>
                  Rôle <span className="sort-indicator">{getSortIndicator('role')}</span>
                </th>
                <th onClick={() => requestSort('fellowshipName')}>
                  Nom de Confrérie <span className="sort-indicator">{getSortIndicator('fellowshipName')}</span>
                </th>
                <th onClick={() => requestSort('warCry')}>
                  Cri de Guerre <span className="sort-indicator">{getSortIndicator('warCry')}</span>
                </th>
                <th onClick={() => requestSort('destiny')}>
                  Destin <span className="sort-indicator">{getSortIndicator('destiny')}</span>
                </th>
                <th className="action-column">Modifier</th>
                <th className="action-column">Supprimer</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player) => (
                <tr key={player.id}>
                  <td>{player.name}</td>
                  <td>
                    {player.guildId ? (
                      <span
                        className="clickable-guild" // Utilisation de la classe de la page GuildManagement
                        onClick={() => handleViewGuild(player.guildId!)}
                        title={`Voir la guilde "${getGuildName(player.guildId)}"`}
                      >
                        {getGuildName(player.guildId)}
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>{player.role}</td>
                  <td>
                    {player.fellowshipId ? (
                      <span
                        className="clickable-fellowship" // Utilisation de la classe de la page FellowshipManagement
                        onClick={() => handleViewFellowship(player.fellowshipId!)}
                        title={`Voir la confrérie "${getFellowshipName(player.fellowshipId)}"`}
                      >
                        {getFellowshipName(player.fellowshipId)}
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>{formatNumberForDisplay(player.warCry)}</td>
                  <td>{formatNumberForDisplay(player.destiny)}</td>
                  <td className="action-column">
                    <button
                      onClick={() => handleEditPlayerClick(player)}
                      className="action-button edit-button"
                      title="Modifier"
                    >
                      ✏️
                    </button>
                  </td>
                  <td className="action-column">
                    <button
                      onClick={() => handleDeletePlayerClick(player)}
                      className="action-button delete-button"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <PlayerCreationModal
        isOpen={isPlayerModalOpen}
        onClose={() => {
          setIsPlayerModalOpen(false);
          setPlayerToEdit(null);
        }}
        onCreate={handlePlayerCreationOrUpdate}
        playerToEdit={playerToEdit}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeletePlayer}
        message={`Êtes-vous sûr de vouloir supprimer le joueur "${playerToDelete?.name}" ? Cette action est irréversible.`}
      />
    </div>
  );
};

export default PlayerManagement;