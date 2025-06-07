// src/components/GuildSelectionModal.tsx
import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { GuildContext } from '../contexts/GuildContext';
import { guildService } from '../services/guildService';
import type { Guild } from '../types/data';
import '../components/Modal.css';

interface GuildSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuildSelected: (guildId: string) => void;
}

const GuildSelectionModal: React.FC<GuildSelectionModalProps> = ({ isOpen, onClose, onGuildSelected }) => {
  // selectedGuildId et setSelectedGuildId ne sont plus utilisés directement ici pour la logique de sélection
  // car onGuildSelected est le callback pour la mise à jour globale.
  // Cependant, les importer peut être utile pour d'autres raisons, comme l'initialisation de la sélection.
  const { selectedGuildId } = useContext(GuildContext); // On peut encore le lire pour initialiser si besoin

  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [error, setError] = useState<string | null>(null);
  // currentSelection est maintenant initialisé à null pour forcer le choix
  const [currentSelection, setCurrentSelection] = useState<string | null>(null);

  // Références pour le focus trap
  const modalRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  // Charger les guildes et gérer le focus.
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setError(null);
      // Réinitialise la sélection locale à null chaque fois que la modale s'ouvre pour forcer un nouveau choix
      setCurrentSelection(null); 

      const loadGuildsAndFocus = async () => {
        try {
          const fetchedGuilds = await guildService.getAllGuilds();
          setGuilds(fetchedGuilds);
          
          // Mettre le focus sur le premier élément focusable (le select)
          setTimeout(() => {
            selectRef.current?.focus();
          }, 0);

        } catch (err) {
          console.error('Erreur lors du chargement des guildes:', err);
          setError('Impossible de charger la liste des guildes.');
        }
      };
      loadGuildsAndFocus();
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]); // Dépend de isOpen uniquement pour l'effet de chargement/initialisation


  // Gestion du piège de focus (inchangé)
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

  // Attacher/détacher l'écouteur d'événement (inchangé)
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


  // Gère la sélection de la guilde et la validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelection) {
      setError('Veuillez sélectionner une guilde.');
      return;
    }
    setError(null);
    // On n'appelle plus setSelectedGuildId ici directement.
    // C'est le parent (Header) qui le fera via onGuildSelected.
    onGuildSelected(currentSelection);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title">Veuillez sélectionner une Guilde</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}
          <div className="form-group">
            <label htmlFor="guild-select-modal">Sélectionner :</label>
            <select
              id="guild-select-modal"
              value={currentSelection || ''} // Si null, l'option vide sera sélectionnée
              onChange={(e) => setCurrentSelection(e.target.value || null)}
              disabled={guilds.length === 0}
              ref={selectRef}
            >
              {guilds.length === 0 ? (
                <option value="">Aucune guilde disponible</option>
              ) : (
                <>
                  <option value="">-- Sélectionnez une guilde --</option>
                  {guilds.map((guild) => (
                    <option key={guild.id} value={guild.id}>
                      {guild.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
          <div className="modal-actions">
            <button type="submit" className="button-primary" disabled={guilds.length === 0 || !currentSelection}>
              Valider
            </button>
            <button type="button" onClick={onClose} className="button-secondary">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GuildSelectionModal;