// src/pages/PlayerManagement.tsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { playerService } from '../services/playerService'; // Import du service de joueur
import { PlayerContext } from '../contexts/PlayerContext'; // Import du contexte de joueur
import ConfirmationModal from '../components/ConfirmationModal';
import './PageStyles.css'; // Assurez-vous que ce fichier existe

const PlayerManagement: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>(); // Récupère playerId des paramètres d'URL
  const navigate = useNavigate();
  const { setSelectedPlayerId } = useContext(PlayerContext); // Utilise le contexte de joueur

  const [playerName, setPlayerName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchPlayerDetails = async () => {
      if (playerId) {
        try {
          setLoading(true);
          setError(null);
          // Utilise le service de joueur pour récupérer les détails
          const player = await playerService.getPlayerById(playerId);
          if (player) {
            setPlayerName(player.name);
          } else {
            setError('Joueur non trouvé.');
            setPlayerName(null);
          }
        } catch (err) {
          console.error('Erreur lors de la récupération du joueur:', err);
          setError('Impossible de charger les détails du joueur.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setPlayerName(null);
        setError('Aucun ID de joueur fourni dans l\'URL.');
      }
    };
    fetchPlayerDetails();
  }, [playerId]); // Dépend de playerId

  const handleDeletePlayer = async () => {
    if (playerId) {
      try {
        // Utilise le service de joueur pour supprimer
        const success = await playerService.deletePlayer(playerId);
        if (success) {
          console.log(`Joueur ${playerName} (ID: ${playerId}) supprimé avec succès.`);
          setSelectedPlayerId(null); // Désélectionne le joueur du contexte global
          navigate('/'); // Redirige vers la page d'accueil
        } else {
          setError('Échec de la suppression du joueur.');
        }
      } catch (err) {
        console.error('Erreur lors de la suppression du joueur:', err);
        setError('Une erreur est survenue lors de la suppression.');
      } finally {
        setIsDeleteModalOpen(false);
      }
    }
  };

  if (loading) {
    return <p>Chargement des détails du joueur...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Erreur: {error}</p>;
  }

  return (
    <div className="page-container">
      {playerId && playerName ? (
        <>
          <div className="entity-header-row"> {/* Utilise la classe générique */}
            <h2 className="entity-title">Gestion du joueur : {playerName}</h2> {/* Utilise la classe générique */}
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="delete-entity-button" // Utilise la classe générique
            >
              Supprimer le Joueur
            </button>
          </div>
          
          <div style={{ marginTop: '30px' }}>
            {/* Ici, vous pourrez ajouter le reste du contenu de gestion de joueur */}
            <p>Contenu de gestion du joueur...</p>
          </div>
        </>
      ) : (
        <p>Aucun joueur sélectionné ou joueur introuvable.</p>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeletePlayer}
        message={`Êtes-vous sûr de vouloir supprimer le joueur "${playerName}" ? Cette action est irréversible.`}
      />
    </div>
  );
};

export default PlayerManagement;