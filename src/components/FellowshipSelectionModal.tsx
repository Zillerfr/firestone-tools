// src/components/FellowshipSelectionModal.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fellowshipService } from '../services/fellowshipService'; // Import du service de confrérie
import type { Fellowship } from '../types/data'; // Import de l'interface Fellowship
import '../components/Modal.css'; // Assurez-vous que les styles de modale sont importés

interface FellowshipSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFellowshipSelected: (fellowshipId: string) => void;
}

const FellowshipSelectionModal: React.FC<FellowshipSelectionModalProps> = ({ isOpen, onClose, onFellowshipSelected }) => {

  const [fellowships, setFellowships] = useState<Fellowship[]>([]);
  const [error, setError] = useState<string | null>(null);
  // currentSelection est initialisé à null pour forcer le choix
  const [currentSelection, setCurrentSelection] = useState<string | null>(null);

  // Références pour le focus trap
  const modalRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  // Charger les confréries et gérer le focus.
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setError(null);
      // Réinitialise la sélection locale à null chaque fois que la modale s'ouvre pour forcer un nouveau choix
      setCurrentSelection(null); 

      const loadFellowshipsAndFocus = async () => {
        try {
          const fetchedFellowships = await fellowshipService.getAllFellowships();
          setFellowships(fetchedFellowships);
          
          // Mettre le focus sur le premier élément focusable (le select)
          setTimeout(() => {
            selectRef.current?.focus();
          }, 0);

        } catch (err) {
          console.error('Erreur lors du chargement des confréries:', err);
          setError('Impossible de charger la liste des confréries.');
        }
      };
      loadFellowshipsAndFocus();
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


  // Gère la sélection de la confrérie et la validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelection) {
      setError('Veuillez sélectionner une confrérie.');
      return;
    }
    setError(null);
    // On n'appelle plus setSelectedFellowshipId ici directement.
    // C'est le parent (Header) qui le fera via onFellowshipSelected.
    onFellowshipSelected(currentSelection);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fellowship-modal-title"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="fellowship-modal-title">Veuillez sélectionner une Confrérie</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}
          <div className="form-group">
            <label htmlFor="fellowship-select-modal">Sélectionner :</label>
            <select
              id="fellowship-select-modal"
              value={currentSelection || ''} // Si null, l'option vide sera sélectionnée
              onChange={(e) => setCurrentSelection(e.target.value || null)}
              disabled={fellowships.length === 0}
              ref={selectRef}
            >
              {fellowships.length === 0 ? (
                <option value="">Aucune confrérie disponible</option>
              ) : (
                <>
                  <option value="">-- Sélectionnez une confrérie --</option>
                  {fellowships.map((fellowship) => (
                    <option key={fellowship.id} value={fellowship.id}>
                      {fellowship.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
          <div className="modal-actions">
            <button type="submit" className="button-primary" disabled={fellowships.length === 0 || !currentSelection}>
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

export default FellowshipSelectionModal;