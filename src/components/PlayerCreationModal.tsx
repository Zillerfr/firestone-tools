// src/components/PlayerCreationModal.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { guildService } from '../services/guildService';
import { fellowshipService } from '../services/fellowshipService';
import { playerService } from '../services/playerService';
import type { Guild, Fellowship, Player } from '../types/data';
import './Modal.css';

interface PlayerCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (player: Player) => void;
  initialFellowshipId?: string | null;
  initialGuildId?: string | null;
  playerToEdit?: Player | null;
}

interface PlayerFormState {
  name: string;
  role: string;
  warCry: number;
  destiny: number;
  guildId: string | null;
  fellowshipId: string | null;
}

const PlayerCreationModal = ({ isOpen, onClose, onCreate, initialFellowshipId, initialGuildId, playerToEdit }: PlayerCreationModalProps) => {
  const [formData, setFormData] = useState<PlayerFormState>({
    name: '',
    role: 'Membre',
    warCry: 0,
    destiny: 0,
    guildId: null,
    fellowshipId: null,
  });

  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [fellowships, setFellowships] = useState<Fellowship[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableElementRef = useRef<HTMLInputElement>(null);

  const [warCryString, setWarCryString] = useState<string>('0');
  const [destinyString, setDestinyString] = useState<string>('0');

  const loadAssociations = useCallback(async () => {
    try {
      const fetchedGuilds = await guildService.getAllGuilds();
      setGuilds(fetchedGuilds);

      const fetchedFellowships = await fellowshipService.getAllFellowships();
      setFellowships(fetchedFellowships);
    } catch (err) {
      console.error('Error loading guilds/fellowships for player creation/edit:', err);
      setError('Impossible de charger les guildes ou confréries.');
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        firstFocusableElementRef.current?.focus();
      }, 0);
      document.body.style.overflow = 'hidden';

      setError(null);
      loadAssociations();

      if (playerToEdit) {
        setFormData({
          name: playerToEdit.name,
          role: playerToEdit.role,
          warCry: playerToEdit.warCry,
          destiny: playerToEdit.destiny,
          guildId: playerToEdit.guildId,
          fellowshipId: playerToEdit.fellowshipId,
        });
        setWarCryString(formatNumberForDisplay(playerToEdit.warCry));
        setDestinyString(formatNumberForDisplay(playerToEdit.destiny));
      } else {
        setFormData({
          name: '',
          role: 'Membre',
          warCry: 0,
          destiny: 0,
          guildId: initialGuildId || null,
          fellowshipId: initialFellowshipId || null,
        });
        setWarCryString('0');
        setDestinyString('0');
      }
    } else {
      document.body.style.overflow = '';
      setFormData({
        name: '',
        role: 'Membre',
        warCry: 0,
        destiny: 0,
        guildId: null,
        fellowshipId: null,
      });
      setWarCryString('0');
      setDestinyString('0');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, loadAssociations, initialFellowshipId, initialGuildId, playerToEdit]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!modalRef.current) return;

    const focusableElements = Array.from(
      modalRef.current.querySelectorAll(
        'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (event.key === 'Tab') {
      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable?.focus();
          event.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable?.focus();
          event.preventDefault();
        }
      }
    } else if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target as HTMLInputElement;

    if (['guildId', 'fellowshipId'].includes(name)) {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? null : value,
      }));
    } else {
      if (name === 'warCry') {
        setWarCryString(value);
        const cleanedValue = value.replace(/\s/g, '').replace(/,/g, '');
        const parsedValue = parseInt(cleanedValue, 10);
        setFormData(prev => ({
          ...prev,
          [name]: isNaN(parsedValue) ? 0 : Math.max(0, parsedValue),
        }));
      } else if (name === 'destiny') {
        setDestinyString(value);
        const cleanedValue = value.replace(/\s/g, '').replace(/,/g, '');
        const parsedValue = parseInt(cleanedValue, 10);
        setFormData(prev => ({
          ...prev,
          [name]: isNaN(parsedValue) ? 0 : Math.max(0, parsedValue),
        }));
      }
      else {
        setFormData(prev => ({
          ...prev,
          [name]: value,
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.name.trim() === '') {
      setError('Le nom du joueur ne peut pas être vide.');
      setLoading(false);
      return;
    }
    if (formData.warCry < 0) {
      setError('Cri de guerre doit être un nombre positif ou nul.');
      setLoading(false);
      return;
    }
    if (formData.destiny < 0) {
      setError('Destin doit être un nombre positif ou nul.');
      setLoading(false);
      return;
    }

    const playerPayload = {
      name: formData.name,
      role: formData.role,
      warCry: formData.warCry,
      destiny: formData.destiny,
      // Ces valeurs viennent directement de formData maintenant, elles sont donc modifiables
      guildId: formData.guildId,
      fellowshipId: formData.fellowshipId,
    };

    try {
      let resultPlayer: Player | undefined;

      if (playerToEdit) {
        // En mode édition, l'ID du joueur est requis
        resultPlayer = await playerService.updatePlayer(playerToEdit.id, playerPayload);
      } else {
        // En mode création
        resultPlayer = await playerService.createPlayer(playerPayload);
      }

      if (resultPlayer) {
        onCreate(resultPlayer);
        onClose();
      } else {
        setError('L\'opération sur le joueur a échoué (réponse vide).');
      }

    } catch (err) {
      console.error('Erreur lors de l\'opération sur le joueur:', err);
      if (err instanceof Error) {
        setError(`Impossible de sauvegarder le joueur. Erreur: ${err.message}`);
      } else {
        setError('Impossible de sauvegarder le joueur. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatNumberForDisplay = useCallback((num: number): string => {
    if (num === null || isNaN(num)) return '';
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-modal-title"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="player-modal-title">{playerToEdit ? `Modifier le Joueur : ${playerToEdit.name}` : 'Créer un nouveau Joueur'}</h2>
        <form onSubmit={handleSubmit}>
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
              ref={firstFocusableElementRef}
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
              <option value="Liste">En liste d'attente</option>
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
              value={warCryString || ''}
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
              value={destinyString || ''}
              onBlur={() => setDestinyString(formatNumberForDisplay(formData.destiny))}
              onChange={handleChange}
              placeholder="Ex: 987 654"
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
              // Suppression de la prop 'disabled' ici
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
              // Suppression de la prop 'disabled' ici
            >
              <option value="">-- Aucune confrérie --</option>
              {fellowships.map((fellowship) => (
                <option key={fellowship.id} value={fellowship.id}>
                  {fellowship.name}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="submit" className="button-primary" disabled={loading}>
              {loading ? 'Sauvegarde...' : (playerToEdit ? 'Mettre à jour' : 'Créer')}
            </button>
            <button type="button" onClick={onClose} className="button-secondary" disabled={loading}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlayerCreationModal;