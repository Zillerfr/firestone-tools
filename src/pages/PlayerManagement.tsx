// src/pages/PlayerManagement.tsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { playerService } from '../services/playerService';
import { guildService } from '../services/guildService';
import { fellowshipService } from '../services/fellowshipService';
import { PlayerContext } from '../contexts/PlayerContext';
import ConfirmationModal from '../components/ConfirmationModal';
import type { Guild, Fellowship } from '../types/data';
import './PageStyles.css';

interface PlayerFormState {
  name: string;
  role: string;
  warCry: number;
  destiny: number;
  participation: number;
  guildId: string | null;
  fellowshipId: string | null;
}

const PlayerManagement: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { setSelectedPlayerId } = useContext(PlayerContext);

  const [formData, setFormData] = useState<PlayerFormState>({
    name: '',
    role: 'Membre',
    warCry: 0,
    destiny: 0,
    participation: 0,
    guildId: null,
    fellowshipId: null,
  });

  const [warCryString, setWarCryString] = useState<string>('');
  const [destinyString, setDestinyString] = useState<string>('');
  const [participationString, setParticipationString] = useState<string>('');

  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [fellowships, setFellowships] = useState<Fellowship[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isFormDirty, setIsFormDirty] = useState<boolean>(false);

  const formatNumberForDisplay = useCallback((num: number): string => {
    if (num === null || isNaN(num)) return '';
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }, []);

  const formatParticipationForDisplay = useCallback((num: number): string => {
    if (num === null || isNaN(num)) return '';
    return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  }, []);

  const loadAssociations = useCallback(async () => {
    try {
      const fetchedGuilds = await guildService.getAllGuilds();
      setGuilds(fetchedGuilds);

      const fetchedFellowships = await fellowshipService.getAllFellowships();
      setFellowships(fetchedFellowships);
    } catch (err) {
      console.error('Erreur lors du chargement des guildes/confréries:', err);
      setError('Impossible de charger les guildes ou confréries.');
    }
  }, []);

  useEffect(() => {
    const fetchPlayerAndAssociations = async () => {
      if (playerId) {
        try {
          setLoading(true);
          setError(null);
          await loadAssociations();

          const player = await playerService.getPlayerById(playerId);
          if (player) {
            setFormData({
              name: player.name,
              role: player.role,
              warCry: player.warCry,
              destiny: player.destiny,
              participation: player.participation,
              guildId: player.guildId || null,
              fellowshipId: player.fellowshipId || null,
            });
            setWarCryString(formatNumberForDisplay(player.warCry));
            setDestinyString(formatNumberForDisplay(player.destiny));
            setParticipationString(formatParticipationForDisplay(player.participation));
            setIsFormDirty(false);
          } else {
            setError('Joueur non trouvé.');
            navigate('/');
          }
        } catch (err) {
          console.error('Erreur lors de la récupération du joueur ou des associations:', err);
          setError('Impossible de charger les détails du joueur ou les associations.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setError('Aucun ID de joueur fourni dans l\'URL.');
        navigate('/');
      }
    };
    fetchPlayerAndAssociations();
  }, [playerId, navigate, loadAssociations, formatNumberForDisplay, formatParticipationForDisplay]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    let updatedFormData: PlayerFormState;

    if (['guildId', 'fellowshipId'].includes(name)) {
        updatedFormData = {
            ...formData,
            [name]: value === '' ? null : value,
        };
    } else {
        if (name === 'warCry') {
            setWarCryString(value);
            const cleanedValue = value.replace(/\s/g, '').replace(/,/g, '');
            const parsedValue = parseInt(cleanedValue, 10);
            updatedFormData = {
                ...formData,
                [name]: isNaN(parsedValue) ? 0 : Math.max(0, parsedValue),
            };
        } else if (name === 'destiny') {
            setDestinyString(value);
            const cleanedValue = value.replace(/\s/g, '').replace(/,/g, '');
            const parsedValue = parseInt(cleanedValue, 10);
            updatedFormData = {
                ...formData,
                [name]: isNaN(parsedValue) ? 0 : Math.max(0, parsedValue),
            };
        } else if (name === 'participation') {
            setParticipationString(value);
            const cleanedValue = value.replace(',', '.');
            let parsedValue = parseFloat(cleanedValue);

            if (isNaN(parsedValue)) {
                parsedValue = 0;
            } else if (parsedValue < 0) {
                parsedValue = 0;
            } else if (parsedValue > 100) {
                parsedValue = 100;
            }
            updatedFormData = {
                ...formData,
                [name]: parsedValue,
            };
        } else {
            updatedFormData = {
                ...formData,
                [name]: value,
            };
        }
    }
    setFormData(updatedFormData);
    setIsFormDirty(true);
  };

  const handleUpdatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerId) {
      setError('ID de joueur manquant pour la mise à jour.');
      return;
    }
    if (formData.name.trim() === '') {
      setError('Le nom du joueur ne peut pas être vide.');
      return;
    }
    if (formData.warCry < 0) {
      setError('Cri de guerre doit être un nombre positif ou nul.');
      return;
    }
    if (formData.destiny < 0) {
      setError('Destin doit être un nombre positif ou nul.');
      return;
    }

    let finalParticipation = formData.participation;
    if (Number.isNaN(finalParticipation)) {
      finalParticipation = 0;
    }
    finalParticipation = Math.max(0, Math.min(100, parseFloat(finalParticipation.toFixed(1))));

    setFormData(prev => ({
        ...prev,
        participation: finalParticipation
    }));

    try {
      setError(null);
      const { ...playerDataToUpdate } = { ...formData, participation: finalParticipation };

      const updatedPlayer = await playerService.updatePlayer(playerId, playerDataToUpdate);
      if (updatedPlayer) {
        console.log(`Joueur ${updatedPlayer.name} (ID: ${playerId}) mis à jour avec succès.`);
        setIsFormDirty(false);
        setWarCryString(formatNumberForDisplay(updatedPlayer.warCry));
        setDestinyString(formatNumberForDisplay(updatedPlayer.destiny));
        setParticipationString(formatParticipationForDisplay(updatedPlayer.participation));
        // navigate('/'); // We can remove this if we want to stay on the page after save
      } else {
        setError('Échec de la mise à jour du joueur ou joueur non trouvé.');
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du joueur:', err);
      setError(`Une erreur est survenue lors de la mise à jour: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDeletePlayer = async () => {
    if (playerId) {
      try {
        const success = await playerService.deletePlayer(playerId);
        if (success) {
          console.log(`Joueur ${formData.name} (ID: ${playerId}) supprimé avec succès.`);
          setSelectedPlayerId(null);
          navigate('/');
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

  // --- NEW NAVIGATION HANDLERS ---
  const handleGoToFellowship = () => {
    if (formData.fellowshipId) {
      navigate(`/fellowship-management/${formData.fellowshipId}`);
    }
  };

  const handleGoToGuild = () => {
    if (formData.guildId) {
      navigate(`/guild-management/${formData.guildId}`);
    }
  };
  // --- END NEW NAVIGATION HANDLERS ---

  if (loading) {
    return <p className="loading-message">Chargement des détails du joueur...</p>;
  }

  if (error && !formData.name) {
    return <p className="error-message">Erreur: {error}</p>;
  }

  if (!playerId) {
    return <p className="info-message">Aucun ID de joueur fourni. Redirection en cours...</p>;
  }

  return (
    <div className="page-container">
      <div className="entity-header-row">
        <h2 className="entity-title">Gestion du joueur : {formData.name || 'Chargement...'}</h2>
        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="delete-entity-button"
        >
          Supprimer le Joueur
        </button>
      </div>

      <form onSubmit={handleUpdatePlayer} className="player-management-form">
        {error && <p className="error-message">{error}</p>}

        <div className="form-group">
          <label htmlFor="name">Nom du Joueur&nbsp;:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ex: Aurelia"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="role">Rôle&nbsp;:</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="Membre">Membre</option>
            <option value="Officier">Officier</option>
            <option value="Chef de guilde">Chef de guilde</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="warCry">Cri de Guerre&nbsp;:</label>
          <input
            type="text"
            id="warCry"
            name="warCry"
            value={warCryString}
            onBlur={() => setWarCryString(formatNumberForDisplay(formData.warCry))}
            onChange={handleChange}
            placeholder="Ex: 1 234 567"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="destiny">Destin&nbsp;:</label>
          <input
            type="text"
            id="destiny"
            name="destiny"
            value={destinyString}
            onBlur={() => setDestinyString(formatNumberForDisplay(formData.destiny))}
            onChange={handleChange}
            placeholder="Ex: 987 654"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="participation">Participation (%)&nbsp;:</label>
          <input
            type="text"
            id="participation"
            name="participation"
            value={participationString}
            onBlur={() => setParticipationString(formatParticipationForDisplay(formData.participation))}
            onChange={handleChange}
            placeholder="Ex: 11,2"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="guildId">Guilde&nbsp;:</label>
          <select
            id="guildId"
            name="guildId"
            value={formData.guildId || ''}
            onChange={handleChange}
          >
            <option value="">-- Aucune guilde --</option>
            {guilds.map((guild) => (
              <option key={guild.id} value={guild.id}>
                {guild.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="fellowshipId">Confrérie&nbsp;:</label>
          <select
            id="fellowshipId"
            name="fellowshipId"
            value={formData.fellowshipId || ''}
            onChange={handleChange}
          >
            <option value="">-- Aucune confrérie --</option>
            {fellowships.map((fellowship) => (
              <option key={fellowship.id} value={fellowship.id}>
                {fellowship.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="button-primary" disabled={!isFormDirty}>
            Sauvegarder les modifications
          </button>

          {/* --- NEW BUTTONS HERE --- */}
          <button
            type="button"
            onClick={handleGoToFellowship}
            className="button-secondary"
            disabled={!formData.fellowshipId}
          >
            Aller à la confrérie
          </button>
          <button
            type="button"
            onClick={handleGoToGuild}
            className="button-secondary"
            disabled={!formData.guildId}
          >
            Aller à la guilde
          </button>
          {/* --- END NEW BUTTONS --- */}

          <button type="button" onClick={() => navigate('/')} className="button-secondary">
            Retour à l'accueil
          </button>
        </div>
      </form>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeletePlayer}
        message={`Êtes-vous sûr de vouloir supprimer le joueur "${formData.name}" ? Cette action est irréversible.`}
      />
    </div>
  );
};

export default PlayerManagement;