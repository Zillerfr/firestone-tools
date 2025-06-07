// src/components/PlayerCreationModal.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { guildService } from '../services/guildService';
import { fellowshipService } from '../services/fellowshipService';
import type { Guild, Fellowship, Player } from '../types/data';
import './Modal.css';

interface PlayerCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (playerData: Omit<Player, 'id'>) => void;
}

interface PlayerFormState {
  name: string;
  role: string;
  warCry: number;
  destiny: number;
  isMember: boolean;
  participation: number;
  guildId: string | null;
  fellowshipId: string | null;
}

const PlayerCreationModal = ({ isOpen, onClose, onCreate }: PlayerCreationModalProps) => {
  const [formData, setFormData] = useState<PlayerFormState>({
    name: '',
    role: 'Membre',
    warCry: 0,
    destiny: 0,
    isMember: false,
    participation: 0,
    guildId: null,
    fellowshipId: null,
  });

  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [fellowships, setFellowships] = useState<Fellowship[]>([]);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableElementRef = useRef<HTMLInputElement>(null);

  const [warCryString, setWarCryString] = useState<string>('0');
  const [destinyString, setDestinyString] = useState<string>('0');
  const [participationString, setParticipationString] = useState<string>('0');


  const loadAssociations = useCallback(async () => {
    try {
      const fetchedGuilds = await guildService.getAllGuilds();
      setGuilds(fetchedGuilds);

      const fetchedFellowships = await fellowshipService.getAllFellowships();
      setFellowships(fetchedFellowships);
    } catch (err) {
      console.error('Error loading guilds/fellowships for player creation:', err);
      setError('Impossible de charger les guildes ou confréries.');
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        firstFocusableElementRef.current?.focus();
      }, 0);
      document.body.style.overflow = 'hidden';
      
      // Réinitialiser les états et les valeurs affichées à l'ouverture
      setFormData({
        name: '',
        role: 'Membre',
        warCry: 0,
        destiny: 0,
        isMember: false,
        participation: 0,
        guildId: null,
        fellowshipId: null,
      });
      setWarCryString('0');
      setDestinyString('0');
      setParticipationString('0');

      setError(null);
      loadAssociations();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, loadAssociations]);

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
    const { name, value, type, checked } = e.target as HTMLInputElement;

    if (type === 'checkbox') {
        setFormData(prev => ({
            ...prev,
            [name]: checked,
        }));
    } else if (['guildId', 'fellowshipId'].includes(name)) {
        setFormData(prev => ({
            ...prev,
            [name]: value === '' ? null : value,
        }));
    } else {
        // Gérer les champs textuels convertis en nombres
        if (name === 'warCry') {
            setWarCryString(value); // Stocke la chaîne brute pour l'affichage
            const cleanedValue = value.replace(/\s/g, '').replace(/,/g, '');
            const parsedValue = parseInt(cleanedValue, 10);
            setFormData(prev => ({
                ...prev,
                [name]: isNaN(parsedValue) ? 0 : Math.max(0, parsedValue),
            }));
        } else if (name === 'destiny') {
            setDestinyString(value); // Stocke la chaîne brute pour l'affichage
            const cleanedValue = value.replace(/\s/g, '').replace(/,/g, '');
            const parsedValue = parseInt(cleanedValue, 10);
            setFormData(prev => ({
                ...prev,
                [name]: isNaN(parsedValue) ? 0 : Math.max(0, parsedValue),
            }));
        } else if (name === 'participation') {
            let inputVal = value;
            // Accepter à la fois la virgule et le point comme séparateur décimal
            inputVal = inputVal.replace(',', '.');

            // Regex pour autoriser des nombres entiers ou avec une seule décimale
            // Et s'assurer que le nombre est entre 0 et 100
            const regex = /^\d*(\.\d{0,1})?$/; // Autorise chiffres, ou point et une décimale max

            if (inputVal === '' || inputVal === '.') {
                // Permettre de vider le champ ou de commencer par un point
                setParticipationString(inputVal);
                setFormData(prev => ({ ...prev, [name]: 0 }));
            } else if (regex.test(inputVal)) {
                let parsedValue = parseFloat(inputVal);

                // Limiter la valeur entre 0 et 100
                if (parsedValue > 100) {
                    parsedValue = 100;
                    setParticipationString('100'); // Mettre à jour la chaîne affichée immédiatement
                } else if (parsedValue < 0) {
                    parsedValue = 0;
                    setParticipationString('0'); // Mettre à jour la chaîne affichée immédiatement
                } else {
                    setParticipationString(inputVal); // Stocke la chaîne brute valide pour l'affichage
                }
                
                setFormData(prev => ({
                    ...prev,
                    [name]: isNaN(parsedValue) ? 0 : parsedValue,
                }));
            }
            // Si la saisie ne correspond pas à la regex, on ne met pas à jour l'état de la chaîne
            // ce qui empêche l'utilisateur de taper des caractères invalides ou plus d'une décimale
            // et maintient la dernière valeur valide affichée.
        } else {
            // Pour les autres champs (comme 'name')
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));
        }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

    // Validation finale pour participation, si jamais le JavaScript côté client était contourné
    let finalParticipation = formData.participation;
    if (Number.isNaN(finalParticipation) || finalParticipation < 0 || finalParticipation > 100) {
      setError('Participation doit être un nombre entre 0.0 et 100.0 avec une décimale.');
      return;
    }
    // Arrondi à une décimale pour la valeur finale stockée
    finalParticipation = parseFloat(finalParticipation.toFixed(1));

    // Mettre à jour le formData avec la valeur arrondie avant de soumettre
    setFormData(prev => ({
        ...prev,
        participation: finalParticipation
    }));

    setError(null);
    // Passer la valeur finale arrondie à onCreate
    onCreate({ ...formData, participation: finalParticipation });
  };

  const formatNumberForDisplay = useCallback((num: number): string => {
    if (num === null || isNaN(num)) return '';
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }, []);

  const formatParticipationForDisplay = useCallback((num: number): string => {
    if (num === null || isNaN(num)) return '';
    return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 });
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
        <h2 id="player-modal-title">Créer un nouveau Joueur</h2>
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

          <div className="form-group checkbox-group">
            <label htmlFor="isMember">Membre Actif&nbsp;:</label>
            <input
              type="checkbox"
              id="isMember"
              name="isMember"
              checked={formData.isMember}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="participation">Participation (%)&nbsp;:</label>
            <input
              type="text"
              id="participation"
              name="participation"
              value={participationString || ''}
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

          <div className="modal-actions">
            <button type="submit" className="button-primary">Créer</button>
            <button type="button" onClick={onClose} className="button-secondary">Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlayerCreationModal;