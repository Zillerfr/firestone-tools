// src/pages/GuildManagement.tsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { guildService } from '../services/guildService';
import { GuildContext } from '../contexts/GuildContext';
import ConfirmationModal from '../components/ConfirmationModal';
import './PageStyles.css'; // Assurez-vous que ce fichier existe

const GuildManagement: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const navigate = useNavigate();
  const { setSelectedGuildId } = useContext(GuildContext);

  const [guildName, setGuildName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchGuildDetails = async () => {
      if (guildId) {
        try {
          setLoading(true);
          setError(null);
          const guild = await guildService.getGuildById(guildId);
          if (guild) {
            setGuildName(guild.name);
          } else {
            setError('Guilde non trouvée.');
            setGuildName(null);
          }
        } catch (err) {
          console.error('Erreur lors de la récupération de la guilde:', err);
          setError('Impossible de charger les détails de la guilde.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setGuildName(null);
        setError('Aucun ID de guilde fourni dans l\'URL.');
      }
    };
    fetchGuildDetails();
  }, [guildId]);

  const handleDeleteGuild = async () => {
    if (guildId) {
      try {
        const success = await guildService.deleteGuild(guildId);
        if (success) {
          console.log(`Guilde ${guildName} (ID: ${guildId}) supprimée avec succès.`);
          setSelectedGuildId(null); // Désélectionne la guilde du contexte global
          navigate('/'); // Redirige vers la page d'accueil
        } else {
          setError('Échec de la suppression de la guilde.');
        }
      } catch (err) {
        console.error('Erreur lors de la suppression de la guilde:', err);
        setError('Une erreur est survenue lors de la suppression.');
      } finally {
        setIsDeleteModalOpen(false);
      }
    }
  };

  if (loading) {
    return <p>Chargement des détails de la guilde...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Erreur: {error}</p>;
  }

  return (
    <div className="page-container">
      {guildId && guildName ? (
        <>
          {/* Nouvelle section pour le titre et le bouton de suppression */}
          <div className="guild-header-row">
            <h2 className="guild-title">Gestion de la guilde **{guildName}**</h2>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="delete-guild-button" // Nouvelle classe CSS pour le bouton
            >
              Supprimer la Guilde
            </button>
          </div>
          
          <div style={{ marginTop: '30px' }}>
            {/* Ici, vous pourrez ajouter le reste du contenu de gestion de guilde (joueurs, etc.) */}
            <p>Contenu de gestion de la guilde...</p>
          </div>
        </>
      ) : (
        <p>Aucune guilde sélectionnée ou guilde introuvable.</p>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteGuild}
        message={`Êtes-vous sûr de vouloir supprimer la guilde "${guildName}" ? Cette action est irréversible.`}
      />
    </div>
  );
};

export default GuildManagement;