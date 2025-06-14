// src/pages/GuildManagement.tsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { guildService } from '../services/guildService';
import { playerService } from '../services/playerService';
import { fellowshipService } from '../services/fellowshipService';
import { GuildContext } from '../contexts/GuildContext';
import ConfirmationModal from '../components/ConfirmationModal';
import PlayerCreationModal from '../components/PlayerCreationModal';
import type { Guild, Player, Fellowship } from '../types/data';
import './PageStyles.css';

const GuildManagement: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const navigate = useNavigate();
  const { setSelectedGuildId } = useContext(GuildContext);

  const [guildName, setGuildName] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPlayerToAdd, setSelectedPlayerToAdd] = useState<string>('');
  const [allGuilds, setAllGuilds] = useState<Guild[]>([]);
  const [allFellowships, setAllFellowships] = useState<Fellowship[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteGuildModalOpen, setIsDeleteGuildModalOpen] = useState<boolean>(false);
  const [isRemovePlayerModalOpen, setIsRemovePlayerModalOpen] = useState<boolean>(false);
  const [playerToRemove, setPlayerToRemove] = useState<Player | null>(null);
  const [isPlayerCreationModalOpen, setIsPlayerCreationModalOpen] = useState<boolean>(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);

  // --- Data Loading ---

  // Effect to load all guilds and fellowships once on component mount
  useEffect(() => {
    const loadGlobalAssociations = async () => {
      try {
        const fetchedGuilds = await guildService.getAllGuilds();
        setAllGuilds(fetchedGuilds.sort((a, b) => a.name.localeCompare(b.name)));

        const fetchedFellowships = await fellowshipService.getAllFellowships();
        setAllFellowships(fetchedFellowships);
      } catch (err) {
        console.error('Erreur lors du chargement des guildes/confréries initiales:', err);
      }
    };
    loadGlobalAssociations();
  }, []);

  // Effect to fetch guild details and players based on guildId
  const fetchGuildAndPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (guildId) {
        const guild = await guildService.getGuildById(guildId);
        if (guild) {
          setGuildName(guild.name);
          const fetchedPlayers = await playerService.getPlayersByGuildId(guildId);

          const playersWithFellowshipNames = fetchedPlayers.map(player => ({
            ...player,
            fellowship: allFellowships.find(f => f.id === player.fellowshipId) || null
          }));
          setPlayers(playersWithFellowshipNames);

          const allPlayers = await playerService.getAllPlayers();
          const availablePlayerMap = new Map<string, Player>();

          allPlayers.forEach(player => {
            const isInCurrentGuild = fetchedPlayers.some(p => p.id === player.id);
            if (!isInCurrentGuild) {
              availablePlayerMap.set(player.id, player);
            }
          });
          setAvailablePlayers(Array.from(availablePlayerMap.values()).sort((a, b) => a.name.localeCompare(b.name)));

        } else {
          setGuildName(null);
          setPlayers([]);
          setAvailablePlayers(await playerService.getAllPlayers());
          setError('La guilde sélectionnée n\'existe pas. Veuillez en créer une ou en choisir une autre.');
        }
      } else {
        setGuildName(null);
        setPlayers([]);
        setAvailablePlayers(await playerService.getAllPlayers());
        setError('Aucune guilde sélectionnée. Veuillez en choisir une ou en créer une nouvelle.');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des données:', err);
      setError('Impossible de charger les détails. Veuillez réessayer.');
      setGuildName(null);
      setPlayers([]);
      setAvailablePlayers([]);
    } finally {
      setLoading(false);
      setSelectedPlayerToAdd('');
    }
  }, [guildId, allFellowships]);

  useEffect(() => {
    fetchGuildAndPlayers();
  }, [fetchGuildAndPlayers, guildId]);


  // --- Event Handlers ---

  const handleDeleteGuild = async () => {
    if (guildId) {
      try {
        const success = await guildService.deleteGuild(guildId);
        if (success) {
          console.log(`Guilde ${guildName} (ID: ${guildId}) supprimée avec succès.`);
          setSelectedGuildId(null);
          navigate('/');
        } else {
          setError('Échec de la suppression de la guilde.');
        }
      } catch (err) {
        console.error('Erreur lors de la suppression de la guilde:', err);
        setError('Une erreur est survenue lors de la suppression.');
      } finally {
        setIsDeleteGuildModalOpen(false);
      }
    }
  };

  const handleEditPlayer = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (player) {
      setPlayerToEdit(player);
      setIsPlayerCreationModalOpen(true);
    }
  };

  const handleConfirmRemovePlayer = (player: Player) => {
    setPlayerToRemove(player);
    setIsRemovePlayerModalOpen(true);
  };

  const handleRemovePlayerFromGuild = async () => {
    if (playerToRemove) {
      try {
        setError(null);
        const updatedPlayer = await playerService.updatePlayer(playerToRemove.id, { guildId: null });

        if (updatedPlayer) {
          console.log(`Joueur ${updatedPlayer.name} retiré de la guilde ${guildName}.`);
          await fetchGuildAndPlayers();
        } else {
          setError('Échec du retrait du joueur de la guilde.');
        }
      } catch (err) {
        console.error('Erreur lors du retrait du joueur de la guilde:', err);
        setError('Une erreur est survenue lors du retrait du joueur.');
      } finally {
        setIsRemovePlayerModalOpen(false);
        setPlayerToRemove(null);
      }
    }
  };

  const handleAddPlayer = async () => {
    if (selectedPlayerToAdd === 'create-new-player') {
      setPlayerToEdit(null);
      setIsPlayerCreationModalOpen(true);
    } else if (selectedPlayerToAdd && guildId) {
      try {
        setError(null);
        const updatedPlayer = await playerService.updatePlayer(selectedPlayerToAdd, { guildId: guildId });
        if (updatedPlayer) {
          console.log(`Joueur ${updatedPlayer.name} ajouté à la guilde ${guildName}.`);
          await fetchGuildAndPlayers();
        } else {
          setError('Échec de l\'ajout du joueur à la guilde.');
        }
      } catch (err) {
        console.error('Erreur lors de l\'ajout du joueur à la guilde:', err);
        setError('Une erreur est survenue lors de l\'ajout du joueur.');
      }
    }
  };

  const handlePlayerOperationCompleted = async (player: Player) => {
    console.log(`Opération sur le joueur ${player.name} terminée.`);
    setIsPlayerCreationModalOpen(false);
    setPlayerToEdit(null);
    await fetchGuildAndPlayers();
  };

  const handleGuildChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGuildId = e.target.value;
    if (newGuildId) {
      navigate(`/guild-management/${newGuildId}`);
    }
  };

  const handleViewFellowship = (fellowshipId: string) => {
    navigate(`/fellowship-management/${fellowshipId}`);
  };

  // NOUVEAU : Fonction pour naviguer vers la page de répartition des loots
  const handleNavigateToChaosRiftLoot = () => {
    if (guildId) {
      navigate(`/chaos-rift-loot/${guildId}`);
    } else {
      setError('Veuillez sélectionner une guilde avant de répartir les loots.');
    }
  };

  // --- Rendering Logic ---

  if (loading) {
    return <p className="loading-message">Chargement des détails de la guilde et de ses joueurs...</p>;
  }

  if (!guildId || guildName === null) {
    return (
      <div className="page-container">
        <div className="entity-header-row">
          <h2 className="entity-title">
            Gestion des guildes
            {allGuilds.length > 0 && (
              <select
                value={guildId || ''}
                onChange={handleGuildChange}
                className="title-select"
                aria-label="Sélectionner une autre guilde"
              >
                {allGuilds.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            )}
          </h2>
        </div>
        <div className="content-section">
          {error && <p className="error-message">{error}</p>}
          {!guildId && <p className="info-message">Aucune guilde sélectionnée. Veuillez en choisir une dans la liste déroulante ci-dessus ou créer un nouveau joueur.</p>}
          {guildName === null && guildId && <p className="info-message">La guilde avec l'ID "{guildId}" n'a pas été trouvée. Veuillez vérifier l'URL, choisir une autre guilde, ou créer un nouveau joueur.</p>}

          <div className="add-player-section">
            <h4>Créer un nouveau joueur</h4>
            <p className="info-message">Vous pouvez créer un nouveau joueur, même s'il n'est pas encore associé à une guilde.</p>
            <div className="form-group">
              <label htmlFor="selectPlayerCreate">Action :</label>
              <select
                id="selectPlayerCreate"
                value={selectedPlayerToAdd}
                onChange={(e) => setSelectedPlayerToAdd(e.target.value)}
              >
                <option value="">-- Choisir une action --</option>
                <option value="create-new-player">Créer un nouveau joueur</option>
              </select>
              <button
                onClick={handleAddPlayer}
                className="button-primary"
                disabled={selectedPlayerToAdd !== 'create-new-player'}
              >
                Créer
              </button>
            </div>
          </div>
        </div>
        <PlayerCreationModal
          isOpen={isPlayerCreationModalOpen}
          onClose={() => { setIsPlayerCreationModalOpen(false); setPlayerToEdit(null); }}
          onCreate={handlePlayerOperationCompleted}
          initialGuildId={guildId}
          playerToEdit={playerToEdit}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <>
        <div className="entity-header-row">
          <h2 className="entity-title">
            Gestion de la guilde :{' '}
            <select
              value={guildId || ''}
              onChange={handleGuildChange}
              className="title-select"
              aria-label="Sélectionner une autre guilde"
            >
              {allGuilds.length === 0 ? (
                <option value="" disabled>Chargement des guildes...</option>
              ) : (
                <>
                  {allGuilds.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </h2>
          {/* NOUVEAU BOUTON : Répartir les loots */}
          <button
            onClick={handleNavigateToChaosRiftLoot}
            className="button-primary" // Utilisez une classe de style appropriée
            style={{ marginRight: '10px' }} // Petite marge pour séparer les boutons
            title="Accéder à la page de répartition des loots de la Faille du Chaos"
          >
            Loots Faille du Chaos
          </button>
          <button
            onClick={() => setIsDeleteGuildModalOpen(true)}
            className="delete-entity-button"
          >
            Supprimer la Guilde
          </button>
        </div>

        <div className="content-section">
          <h3>Joueurs de la Guilde ({players.length})</h3>
          {error && <p className="error-message">{error}</p>}
          {players.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nom du joueur</th>
                    <th>Rôle</th>
                    <th>Confrérie</th>
                    <th className="action-column">Modifier</th>
                    <th className="action-column">Retirer</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <tr key={player.id}>
                      <td>{player.name}</td>
                      <td>{player.role}</td>
                      <td>
                        {player.fellowship ? (
                          <span
                            className="clickable-fellowship"
                            onClick={() => handleViewFellowship(player.fellowship!.id)}
                            title={`Voir la confrérie "${player.fellowship.name}"`}
                          >
                            {player.fellowship.name}
                          </span>
                        ) : (
                          'Aucune'
                        )}
                      </td>
                      <td className="action-column">
                        <button
                          onClick={() => handleEditPlayer(player.id)}
                          className="action-button edit-button"
                          title="Modifier le joueur"
                        >
                          ✏️
                        </button>
                      </td>
                      <td className="action-column">
                        <button
                          onClick={() => handleConfirmRemovePlayer(player)}
                          className="action-button delete-button"
                          title="Retirer de la guilde"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>Aucun joueur trouvé pour cette guilde.</p>
          )}

          <div className="add-player-section">
            <h4>Ajouter un joueur à la guilde</h4>
            <div className="form-group">
              <label htmlFor="selectPlayer">Sélectionner un joueur :</label>
              <select
                id="selectPlayer"
                value={selectedPlayerToAdd}
                onChange={(e) => setSelectedPlayerToAdd(e.target.value)}
              >
                <option value="">-- Choisir un joueur --</option>
                <option value="create-new-player">Créer un nouveau joueur</option>
                {availablePlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddPlayer}
                className="button-primary"
                disabled={!selectedPlayerToAdd}
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      </>

      <ConfirmationModal
        isOpen={isDeleteGuildModalOpen}
        onClose={() => setIsDeleteGuildModalOpen(false)}
        onConfirm={handleDeleteGuild}
        message={`Êtes-vous sûr de vouloir supprimer la guilde "${guildName}" ? Cette action est irréversible.`}
      />

      <ConfirmationModal
        isOpen={isRemovePlayerModalOpen}
        onClose={() => setIsRemovePlayerModalOpen(false)}
        onConfirm={handleRemovePlayerFromGuild}
        message={playerToRemove ? `Êtes-vous sûr de vouloir retirer "${playerToRemove.name}" de cette guilde ? Le joueur ne sera pas supprimé du jeu.` : ''}
      />

      <PlayerCreationModal
        isOpen={isPlayerCreationModalOpen}
        onClose={() => { setIsPlayerCreationModalOpen(false); setPlayerToEdit(null); }}
        onCreate={handlePlayerOperationCompleted}
        initialGuildId={guildId}
        playerToEdit={playerToEdit}
      />
    </div>
  );
};

export default GuildManagement;