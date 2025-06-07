// src/components/PlayerSelectionModal.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playerService } from '../services/playerService'; // Import du service de joueur
import type { Player } from '../types/data'; // Import de l'interface Player
import '../components/Modal.css'; // Assurez-vous que les styles de modale sont importés

interface PlayerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayerSelected: (playerId: string) => void;
}

const PlayerSelectionModal: React.FC<PlayerSelectionModalProps> = ({ isOpen, onClose, onPlayerSelected }) => {

  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentSelection, setCurrentSelection] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  // Charger les joueurs et gérer le focus.
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setError(null);
      setCurrentSelection(null); 

      const loadPlayersAndFocus = async () => {
        try {
          const fetchedPlayers = await playerService.getAllPlayers();
          setPlayers(fetchedPlayers);
          
          setTimeout(() => {
            selectRef.current?.focus();
          }, 0);

        } catch (err) {
          console.error('Erreur lors du chargement des joueurs:', err);
          setError('Impossible de charger la liste des joueurs.');
        }
      };
      loadPlayersAndFocus();
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);


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


  // Gère la sélection du joueur et la validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelection) {
      setError('Veuillez sélectionner un joueur.');
      return;
    }
    setError(null);
    onPlayerSelected(currentSelection);
  };

  if (!isOpen) return null;

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
        <h2 id="player-modal-title">Veuillez sélectionner un Joueur</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}
          <div className="form-group">
            <label htmlFor="player-select-modal">Sélectionner :</label>
            <select
              id="player-select-modal"
              value={currentSelection || ''}
              onChange={(e) => setCurrentSelection(e.target.value || null)}
              disabled={players.length === 0}
              ref={selectRef}
            >
              {players.length === 0 ? (
                <option value="">Aucun joueur disponible</option>
              ) : (
                <>
                  <option value="">-- Sélectionnez un joueur --</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
          <div className="modal-actions">
            <button type="submit" className="button-primary" disabled={players.length === 0 || !currentSelection}>
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

export default PlayerSelectionModal;