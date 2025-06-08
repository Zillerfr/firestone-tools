// src/pages/FellowshipManagement.tsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fellowshipService } from '../services/fellowshipService';
import { playerService } from '../services/playerService';
import { FellowshipContext } from '../contexts/FellowshipContext';
import ConfirmationModal from '../components/ConfirmationModal';
import type { Player } from '../types/data';
import './PageStyles.css';

const FellowshipManagement: React.FC = () => {
  const { fellowshipId } = useParams<{ fellowshipId: string }>();
  const navigate = useNavigate();
  const { setSelectedFellowshipId } = useContext(FellowshipContext);

  const [fellowshipName, setFellowshipName] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteFellowshipModalOpen, setIsDeleteFellowshipModalOpen] = useState<boolean>(false);
  const [isRemovePlayerModalOpen, setIsRemovePlayerModalOpen] = useState<boolean>(false);
  const [playerToRemove, setPlayerToRemove] = useState<Player | null>(null);

  const totalWarCry = players.reduce((sum, player) => sum + player.warCry, 0);
  const totalDestiny = players.reduce((sum, player) => sum + player.destiny, 0);
  // Nouveau calcul pour la puissance totale
  const totalPower = totalWarCry + totalDestiny;


  const formatNumberForDisplay = useCallback((num: number): string => {
    if (num === null || isNaN(num)) return '';
    return num.toLocaleString('fr-FR');
  }, []);

  const fetchFellowshipAndPlayers = useCallback(async () => {
    if (fellowshipId) {
      try {
        setLoading(true);
        setError(null);

        const fellowship = await fellowshipService.getFellowshipById(fellowshipId);
        if (fellowship) {
          setFellowshipName(fellowship.name);
        } else {
          setError('Confrérie non trouvée.');
          setFellowshipName(null);
          setLoading(false);
          return;
        }

        const fetchedPlayers = await playerService.getPlayersByFellowshipId(fellowshipId);
        setPlayers(fetchedPlayers);

      } catch (err) {
        console.error('Erreur lors de la récupération de la confrérie ou des joueurs:', err);
        setError('Impossible de charger les détails de la confrérie ou de ses joueurs.');
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
      setFellowshipName(null);
      setError('Aucun ID de confrérie fourni dans l\'URL.');
    }
  }, [fellowshipId]);

  useEffect(() => {
    fetchFellowshipAndPlayers();
  }, [fetchFellowshipAndPlayers]);

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

  if (loading) {
    return <p className="loading-message">Chargement des détails de la confrérie et de ses joueurs...</p>;
  }

  if (error) {
    return <p className="error-message">Erreur: {error}</p>;
  }

  return (
    <div className="page-container">
      {fellowshipId && fellowshipName ? (
        <>
          <div className="entity-header-row">
            <h2 className="entity-title">Gestion de la confrérie : {fellowshipName}</h2>
            <button
              onClick={() => setIsDeleteFellowshipModalOpen(true)}
              className="delete-entity-button"
            >
              Supprimer la Confrérie
            </button>
          </div>

          <div className="content-section">
            <h3>Joueurs de la Confrérie</h3>
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
                      <th className="action-column">Supprimer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player) => (
                      <tr key={player.id}>
                        <td>{player.name}</td>
                        <td>{player.guild?.name || 'Aucune'}</td>
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
                      {/* Nouvelle cellule pour "Puissance" sous "Modifier" */}
                      <td className="action-column">Puissance</td>
                      {/* Nouvelle cellule pour la somme des totaux sous "Supprimer" */}
                      <td className="action-column">{formatNumberForDisplay(totalPower)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p>Aucun joueur trouvé pour cette confrérie.</p>
            )}
          </div>
        </>
      ) : (
        <p className="info-message">Aucune confrérie sélectionnée ou confrérie introuvable.</p>
      )}

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
    </div>
  );
};

export default FellowshipManagement;