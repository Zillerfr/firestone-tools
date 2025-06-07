// src/components/ConfirmationModal.tsx
import React, { useEffect, useRef, useCallback } from 'react';
import './Modal.css'; // Réutilise le CSS des modales existantes

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void; // Callback quand l'utilisateur annule ou ferme
  onConfirm: () => void; // Callback quand l'utilisateur confirme l'action
  message: string; // Message à afficher dans la popin
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, message }) => {
  // Références pour le focus trap
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null); // Référence pour le bouton de confirmation

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Désactiver le scroll du body
      // Mettre le focus sur le bouton de confirmation quand la modale s'ouvre
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 0);
    } else {
      document.body.style.overflow = ''; // Réactiver le scroll du body
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Gestion du piège de focus
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
      if (event.shiftKey) { // Si Shift + Tab
        if (document.activeElement === firstFocusable) {
          lastFocusable?.focus();
          event.preventDefault();
        }
      } else { // Si Tab
        if (document.activeElement === lastFocusable) {
          firstFocusable?.focus();
          event.preventDefault();
        }
      }
    } else if (event.key === 'Escape') { // Gérer la fermeture avec la touche Échap
      onClose();
    }
  }, [onClose]);

  // Attacher et détacher l'écouteur d'événement
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

  if (!isOpen) {
    return null; // Ne rend rien si la modale n'est pas ouverte
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        role="alertdialog" // Rôle ARIA pour une boîte de dialogue d'alerte
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-message"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirmation-title">Confirmation Requise</h2>
        <p id="confirmation-message">{message}</p>

        <div className="modal-actions">
          <button
            type="button"
            onClick={onConfirm}
            className="button-primary" // Utilisez la classe pour le bouton principal
            style={{ backgroundColor: '#f44336' }} // Couleur rouge pour la confirmation de suppression
            ref={confirmButtonRef} // Attachez la référence ici
          >
            Confirmer
          </button>
          <button
            type="button"
            onClick={onClose}
            className="button-secondary"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;