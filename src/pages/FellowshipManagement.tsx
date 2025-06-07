// src/pages/FellowshipManagement.tsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fellowshipService } from '../services/fellowshipService'; // Import du service de confrérie
import { FellowshipContext } from '../contexts/FellowshipContext'; // Import du contexte de confrérie
import ConfirmationModal from '../components/ConfirmationModal';
import './PageStyles.css'; // Assurez-vous que ce fichier existe et contient les styles nécessaires

const FellowshipManagement: React.FC = () => {
  const { fellowshipId } = useParams<{ fellowshipId: string }>(); // Récupère fellowshipId des paramètres d'URL
  const navigate = useNavigate();
  const { setSelectedFellowshipId } = useContext(FellowshipContext); // Utilise le contexte de confrérie

  const [fellowshipName, setFellowshipName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchFellowshipDetails = async () => {
      if (fellowshipId) {
        try {
          setLoading(true);
          setError(null);
          // Utilise le service de confrérie pour récupérer les détails
          const fellowship = await fellowshipService.getFellowshipById(fellowshipId);
          if (fellowship) {
            setFellowshipName(fellowship.name);
          } else {
            setError('Confrérie non trouvée.');
            setFellowshipName(null);
          }
        } catch (err) {
          console.error('Erreur lors de la récupération de la confrérie:', err);
          setError('Impossible de charger les détails de la confrérie.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setFellowshipName(null);
        setError('Aucun ID de confrérie fourni dans l\'URL.');
      }
    };
    fetchFellowshipDetails();
  }, [fellowshipId]); // Dépend de fellowshipId

  const handleDeleteFellowship = async () => {
    if (fellowshipId) {
      try {
        // Utilise le service de confrérie pour supprimer
        const success = await fellowshipService.deleteFellowship(fellowshipId);
        if (success) {
          console.log(`Confrérie ${fellowshipName} (ID: ${fellowshipId}) supprimée avec succès.`);
          setSelectedFellowshipId(null); // Désélectionne la confrérie du contexte global
          navigate('/'); // Redirige vers la page d'accueil
        } else {
          setError('Échec de la suppression de la confrérie.');
        }
      } catch (err) {
        console.error('Erreur lors de la suppression de la confrérie:', err);
        setError('Une erreur est survenue lors de la suppression.');
      } finally {
        setIsDeleteModalOpen(false);
      }
    }
  };

  if (loading) {
    return <p>Chargement des détails de la confrérie...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Erreur: {error}</p>;
  }

  return (
    <div className="page-container">
      {fellowshipId && fellowshipName ? (
        <>
          {/* Nouvelle section pour le titre et le bouton de suppression */}
          <div className="entity-header-row"> {/* Nouvelle classe CSS pour le conteneur */}
            <h2 className="entity-title">Gestion de la confrérie : {fellowshipName}</h2>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="delete-entity-button" // Nouvelle classe CSS pour le bouton
            >
              Supprimer la Confrérie
            </button>
          </div>
          
          <div style={{ marginTop: '30px' }}>
            {/* Ici, vous pourrez ajouter le reste du contenu de gestion de confrérie (joueurs, etc.) */}
            <p>Contenu de gestion de la confrérie...</p>
          </div>
        </>
      ) : (
        <p>Aucune confrérie sélectionnée ou confrérie introuvable.</p>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteFellowship}
        message={`Êtes-vous sûr de vouloir supprimer la confrérie "${fellowshipName}" ? Cette action est irréversible.`}
      />
    </div>
  );
};

export default FellowshipManagement;