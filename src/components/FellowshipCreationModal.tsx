// src/components/FellowshipCreationModal.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Modal.css'; // Assurez-vous que les styles de modale sont importés

interface FellowshipCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (fellowshipName: string) => void;
}

const FellowshipCreationModal: React.FC<FellowshipCreationModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [fellowshipName, setFellowshipName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableElementRef = useRef<HTMLInputElement>(null);

  // Gérer le focus et le scroll du body
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        firstFocusableElementRef.current?.focus();
      }, 0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setFellowshipName('');
      setError(null);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Gérer le piège de focus et la fermeture avec Échap
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fellowshipName.trim() === '') {
      setError('Le nom de la confrérie ne peut pas être vide.');
      return;
    }
    setError(null);
    onCreate(fellowshipName);
  };

  if (!isOpen) {
    return null;
  }

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
        <h2 id="fellowship-modal-title">Créer une nouvelle Confrérie</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fellowshipName">Nom de la Confrérie :</label>
            <input
              type="text"
              id="fellowshipName"
              value={fellowshipName}
              onChange={(e) => setFellowshipName(e.target.value)}
              placeholder="Ex: Les Gardiens de l'Ombre"
              required
              ref={firstFocusableElementRef}
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="modal-actions">
            <button type="submit" className="button-primary">Créer</button>
            <button type="button" onClick={onClose} className="button-secondary">Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FellowshipCreationModal;