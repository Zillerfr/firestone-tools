// src/pages/FellowshipManagement.tsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fellowshipService } from '../services/fellowshipService';
import { playerService } from '../services/playerService';
import { guildService } from '../services/guildService';
import { FellowshipContext } from '../contexts/FellowshipContext';
import ConfirmationModal from '../components/ConfirmationModal';
import PlayerCreationModal from '../components/PlayerCreationModal';
import type { Player, Fellowship, Guild } from '../types/data'; // Assurez-vous que Player et Fellowship sont bien importés
import './PageStyles.css';

const FellowshipManagement: React.FC = () => {
  const { fellowshipId } = useParams<{ fellowshipId: string }>();
  const navigate = useNavigate();
  const { setSelectedFellowshipId } = useContext(FellowshipContext);

  const [fellowshipName, setFellowshipName] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPlayerToAdd, setSelectedPlayerToAdd] = useState<string>('');
  const [allFellowships, setAllFellowships] = useState<Fellowship[]>([]);
  const [allGuilds, setAllGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialDataLoaded, setInitialDataLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteFellowshipModalOpen, setIsDeleteFellowshipModalOpen] = useState<boolean>(false);
  const [isRemovePlayerModalOpen, setIsRemovePlayerModalOpen] = useState<boolean>(false);
  const [playerToRemove, setPlayerToRemove] = useState<Player | null>(null);
  const [isPlayerCreationModalOpen, setIsPlayerCreationModalOpen] = useState<boolean>(false);

  const MAX_PLAYERS_IN_FELLOWSHIP = 5;
  const isFellowshipFull = players.length >= MAX_PLAYERS_IN_FELLOWSHIP;

  const totalWarCry = players.reduce((sum, player) => sum + player.warCry, 0);
  const totalDestiny = players.reduce((sum, player) => sum + player.destiny, 0);
  const totalPower = totalWarCry + totalDestiny;

  const formatNumberForDisplay = useCallback((num: number): string => {
    if (num === null || isNaN(num)) return '';
    return num.toLocaleString('fr-FR');
  }, []);

  // Effect pour charger toutes les confréries et toutes les guildes une fois au montage
  useEffect(() => {
    const loadGlobalAssociations = async () => {
      try {
        const fetchedFellowships = await fellowshipService.getAllFellowships();
        setAllFellowships(fetchedFellowships);

        const fetchedGuilds = await guildService.getAllGuilds();
        setAllGuilds(fetchedGuilds.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.error('Erreur lors du chargement des confréries/guildes initiales:', err);
        setError('Impossible de charger la liste des confréries ou des guildes.');
      } finally {
        setInitialDataLoaded(true);
      }
    };
    loadGlobalAssociations();
  }, []);

  const fetchFellowshipAndPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Récupérer toutes les confréries une seule fois ici pour éviter des appels répétitifs
      const allFellowshipsData = await fellowshipService.getAllFellowships();
      const fellowshipMap = new Map<string, string>(); // Map fellowship ID to name
      allFellowshipsData.forEach(f => fellowshipMap.set(f.id, f.name));

      if (fellowshipId) {
        const fellowship = await fellowshipService.getFellowshipById(fellowshipId);
        if (fellowship) {
          setFellowshipName(fellowship.name);
          const fetchedPlayers = await playerService.getPlayersByFellowshipId(fellowshipId);

          const playersWithGuildNames = fetchedPlayers.map(player => ({
            ...player,
            guild: allGuilds.find(g => g.id === player.guildId) || null
          }));
          setPlayers(playersWithGuildNames);

          const allPlayers = await playerService.getAllPlayers();
          const availablePlayerMap = new Map<string, Player>();

          allPlayers.forEach(player => {
            const isInCurrentFellowship = fetchedPlayers.some(p => p.id === player.id);
            if (!isInCurrentFellowship) {
              // Si le joueur est dans une confrérie, nous créons un objet Fellowship
              // et l'attachons à l'objet Player.
              const playerFellowship = player.fellowshipId
                ? allFellowshipsData.find(f => f.id === player.fellowshipId) || null
                : null;
              availablePlayerMap.set(player.id, { ...player, fellowship: playerFellowship });
            }
          });

          setAvailablePlayers(Array.from(availablePlayerMap.values()).sort((a, b) => a.name.localeCompare(b.name)));

        } else {
          setFellowshipName(null);
          setPlayers([]);
          const allPlayers = await playerService.getAllPlayers();
          const playersWithFellowshipInfo = allPlayers.map(player => ({
            ...player,
            fellowship: player.fellowshipId ? allFellowshipsData.find(f => f.id === player.fellowshipId) || null : null
          }));
          setAvailablePlayers(playersWithFellowshipInfo.sort((a, b) => a.name.localeCompare(b.name)));
          setError('La confrérie sélectionnée n\'existe pas. Veuillez en créer une ou en choisir une autre.');
        }
      } else {
        setFellowshipName(null);
        setPlayers([]);
        const allPlayers = await playerService.getAllPlayers();
        const playersWithFellowshipInfo = allPlayers.map(player => ({
          ...player,
          fellowship: player.fellowshipId ? allFellowshipsData.find(f => f.id === player.fellowshipId) || null : null
        }));
        setAvailablePlayers(playersWithFellowshipInfo.sort((a, b) => a.name.localeCompare(b.name)));
        setError('Aucune confrérie sélectionnée. Veuillez en choisir une ou en créer une nouvelle.');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des données:', err);
      setError('Impossible de charger les détails. Veuillez réessayer.');
      setFellowshipName(null);
      setPlayers([]);
      setAvailablePlayers([]);
    } finally {
      setLoading(false);
      setSelectedPlayerToAdd('');
    }
  }, [fellowshipId, allGuilds]); // Dépendance à allGuilds est correcte pour les players dans la confrérie actuelle

  useEffect(() => {
    if (initialDataLoaded) {
      fetchFellowshipAndPlayers();
    }
  }, [fetchFellowshipAndPlayers, initialDataLoaded]);


  const handleDeleteFellowship = async () => {
    if (fellowshipId) {
      try {
        const success = await fellowshipService.deleteFellowship(fellowshipId);
        if (success) {
          console.log(`Confrérie ${fellowshipName} (ID: ${fellowshipId}) supprimée avec succès.`);
          setSelectedFellowshipId(null);
          navigate('/');
        } else {
          setError('Échec de la suppression de la confrérie.');
        }
      } catch (err) {
        console.error('Erreur lors de la suppression de la confrérie:', err);
        setError('Une erreur est survenue lors de la suppression.');
      } finally {
        setIsDeleteFellowshipModalOpen(false);
      }
    }
  };

  const handleEditPlayer = (playerId: string) => {
    navigate(`/player-management/${playerId}`);
  };

  const handleConfirmRemovePlayer = (player: Player) => {
    setPlayerToRemove(player);
    setIsRemovePlayerModalOpen(true);
  };

  const handleRemovePlayerFromFellowship = async () => {
    if (playerToRemove) {
      try {
        setError(null);
        const updatedPlayer = await playerService.updatePlayer(playerToRemove.id, { fellowshipId: null });

        if (updatedPlayer) {
          console.log(`Joueur ${updatedPlayer.name} retiré de la confrérie ${fellowshipName}.`);
          await fetchFellowshipAndPlayers();
        } else {
          setError('Échec du retrait du joueur de la confrérie.');
        }
      } catch (err) {
        console.error('Erreur lors du retrait du joueur de la confrérie:', err);
        setError('Une erreur est survenue lors du retrait du joueur.');
      } finally {
        setIsRemovePlayerModalOpen(false);
        setPlayerToRemove(null);
      }
    }
  };

  const handleAddPlayer = async () => {
    if (isFellowshipFull) {
      setError('La confrérie a déjà le nombre maximum de joueurs (5).');
      return;
    }

    if (selectedPlayerToAdd === 'create-new-player') {
      setIsPlayerCreationModalOpen(true);
    } else if (selectedPlayerToAdd && fellowshipId) {
      try {
        setError(null);
        const updatedPlayer = await playerService.updatePlayer(selectedPlayerToAdd, { fellowshipId: fellowshipId });
        if (updatedPlayer) {
          console.log(`Joueur ${updatedPlayer.name} ajouté à la confrérie ${fellowshipName}.`);
          await fetchFellowshipAndPlayers();
        } else {
          setError('Échec de l\'ajout du joueur à la confrérie.');
        }
      } catch (err) {
        console.error('Erreur lors de l\'ajout du joueur à la confrérie:', err);
        setError('Une erreur est survenue lors de l\'ajout du joueur.');
      }
    }
  };

  const handlePlayerCreated = async (newPlayer: Player) => {
    console.log(`Nouveau joueur ${newPlayer.name} créé et (potentiellement) ajouté à la confrérie.`);
    setIsPlayerCreationModalOpen(false);
    await fetchFellowshipAndPlayers();
  };

  const handleFellowshipChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFellowshipId = e.target.value;
    if (newFellowshipId) {
      navigate(`/fellowship-management/${newFellowshipId}`);
    }
  };

  const handleViewGuild = (guildId: string) => {
    navigate(`/guild-management/${guildId}`);
  };

  // --- RENDU CONDITIONNEL AMÉLIORÉ ---

  // 1. État de chargement initial : Afficher un message de chargement tant que les données globales ne sont pas chargées
  if (!initialDataLoaded) {
    return <p className="loading-message">Chargement des données initiales (confréries et guildes)...</p>;
  }

  // 2. Rendu si aucune confrérie n'est sélectionnée ou trouvée après le chargement initial
  // On utilise 'loading' ici pour gérer le cas où un ID est présent mais la confrérie est introuvable
  // ou si la confrérie est en cours de chargement spécifique
  if (!fellowshipId || fellowshipName === null) {
    return (
      <div className="page-container">
        <div className="entity-header-row">
          <h2 className="entity-title">
            Gestion des Confréries
            {/* Afficher le sélecteur seulement s'il y a des confréries disponibles */}
            {allFellowships.length > 0 && (
              <select
                value={fellowshipId || ''}
                onChange={handleFellowshipChange}
                className="title-select"
                aria-label="Sélectionner une autre confrérie"
              >
                <option value="">-- Sélectionner une confrérie --</option>
                {allFellowships.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            )}
          </h2>
        </div>
        <div className="content-section">
          {loading ? (
            <p className="loading-message">Chargement des détails de la confrérie...</p>
          ) : (
            <>
              {error && <p className="error-message">{error}</p>}
              {!fellowshipId && allFellowships.length === 0 && (
                <p className="info-message">Aucune confrérie trouvée. Vous pouvez créer une nouvelle confrérie ou un nouveau joueur (qui pourra ensuite être assigné à une confrérie).</p>
              )}
              {!fellowshipId && allFellowships.length > 0 && (
                <p className="info-message">Aucune confrérie sélectionnée. Veuillez en choisir une dans la liste déroulante ci-dessus ou créer un nouveau joueur.</p>
              )}
              {fellowshipName === null && fellowshipId && (
                <p className="info-message">La confrérie avec l'ID "{fellowshipId}" n'a pas été trouvée. Veuillez vérifier l'URL, choisir une autre confrérie, ou créer un nouveau joueur.</p>
              )}

              <div className="add-player-section">
                <h4>Créer un nouveau joueur</h4>
                <p className="info-message">Vous pouvez créer un nouveau joueur, même s'il n'est pas encore associé à une confrérie.</p>
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
            </>
          )}
        </div>
        <PlayerCreationModal
          isOpen={isPlayerCreationModalOpen}
          onClose={() => setIsPlayerCreationModalOpen(false)}
          onCreate={handlePlayerCreated}
          initialFellowshipId={fellowshipId}
        />
      </div>
    );
  }

  // 3. Rendu normal lorsque la confrérie est trouvée et chargée
  return (
    <div className="page-container">
      <>
        <div className="entity-header-row">
          <h2 className="entity-title">
            Gestion de la confrérie :{' '}
            <select
              value={fellowshipId || ''}
              onChange={handleFellowshipChange}
              className="title-select"
              aria-label="Sélectionner une autre confrérie"
            >
              {allFellowships.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </h2>
          <button
            onClick={() => setIsDeleteFellowshipModalOpen(true)}
            className="delete-entity-button"
          >
            Supprimer la Confrérie
          </button>
        </div>

        <div className="content-section">
          <h3>Joueurs de la Confrérie ({players.length}/{MAX_PLAYERS_IN_FELLOWSHIP})</h3>
          {error && <p className="error-message">{error}</p>}
          {players.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nom du joueur</th>
                    <th>Guilde</th>
                    <th className="align-right">Cri de guerre</th>
                    <th className="align-right">Destin</th>
                    <th className="action-column">Modifier</th>
                    <th className="action-column">Retirer</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <tr key={player.id}>
                      <td>{player.name}</td>
                      <td>
                        {player.guild ? (
                          <span
                            className="clickable-guild"
                            onClick={() => handleViewGuild(player.guild!.id)}
                            title={`Voir la guilde "${player.guild.name}"`}
                          >
                            {player.guild.name}
                          </span>
                        ) : (
                          'Aucune'
                        )}
                      </td>
                      <td className="align-right">{formatNumberForDisplay(player.warCry)}</td>
                      <td className="align-right">{formatNumberForDisplay(player.destiny)}</td>
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
                          title="Retirer de la confrérie"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="totals-row">
                    <td colSpan={2}>Total</td>
                    <td className="align-right">{formatNumberForDisplay(totalWarCry)}</td>
                    <td className="align-right">{formatNumberForDisplay(totalDestiny)}</td>
                    <td className="action-column">Puissance</td>
                    <td className="action-column">{formatNumberForDisplay(totalPower)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p>Aucun joueur trouvé pour cette confrérie.</p>
          )}

          <div className="add-player-section">
            <h4>Ajouter un joueur à la confrérie</h4>
            {isFellowshipFull && (
              <p className="warning-message">Cette confrérie a atteint sa limite de {MAX_PLAYERS_IN_FELLOWSHIP} joueurs.</p>
            )}
            <div className="form-group">
              <label htmlFor="selectPlayer">Sélectionner un joueur :</label>
              <select
                id="selectPlayer"
                value={selectedPlayerToAdd}
                onChange={(e) => setSelectedPlayerToAdd(e.target.value)}
                disabled={isFellowshipFull}
              >
                <option value="">-- Choisir un joueur --</option>
                <option value="create-new-player" disabled={isFellowshipFull}>Créer un joueur</option>
                {availablePlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {/* Utiliser player.fellowship?.name pour accéder au nom de la confrérie */}
                    {player.name} {player.fellowship ? `(${player.fellowship.name})` : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddPlayer}
                className="button-primary"
                disabled={!selectedPlayerToAdd || isFellowshipFull}
              >
                Ajouter
              </button>
            </div>
          </div>

        </div>
      </>

      <ConfirmationModal
        isOpen={isDeleteFellowshipModalOpen}
        onClose={() => setIsDeleteFellowshipModalOpen(false)}
        onConfirm={handleDeleteFellowship}
        message={`Êtes-vous sûr de vouloir supprimer la confrérie "${fellowshipName}" ? Cette action est irréversible.`}
      />

      <ConfirmationModal
        isOpen={isRemovePlayerModalOpen}
        onClose={() => setIsRemovePlayerModalOpen(false)}
        onConfirm={handleRemovePlayerFromFellowship}
        message={playerToRemove ? `Êtes-vous sûr de vouloir retirer "${playerToRemove.name}" de cette confrérie ? Le joueur ne sera pas supprimé du jeu.` : ''}
      />

      <PlayerCreationModal
        isOpen={isPlayerCreationModalOpen}
        onClose={() => setIsPlayerCreationModalOpen(false)}
        onCreate={handlePlayerCreated}
        initialFellowshipId={fellowshipId}
      />
    </div>
  );
};

export default FellowshipManagement;