// src/components/GuildCreationModal.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react'; // Importez useRef et useCallback
import './Modal.css';

interface GuildCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (guildName: string) => void;
}

const GuildCreationModal: React.FC<GuildCreationModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [guildName, setGuildName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Référence pour le conteneur de la modale (pour le focus trap)
  const modalRef = useRef<HTMLDivElement>(null);
  // Référence pour le premier élément focusable (le champ de saisie)
  const firstFocusableElementRef = useRef<HTMLInputElement>(null);

  // Gérer le focus au montage de la modale et la réinitialisation
  useEffect(() => {
    if (isOpen) {
      // Mettre le focus sur le premier élément focusable quand la modale s'ouvre
      // Utilisation de setTimeout pour s'assurer que le rendu est terminé
      setTimeout(() => {
        firstFocusableElementRef.current?.focus();
      }, 0);

      // Désactiver le scroll du body quand la modale est ouverte
      document.body.style.overflow = 'hidden';
    } else {
      // Réactiver le scroll du body quand la modale est fermée
      document.body.style.overflow = '';
      setGuildName('');
      setError(null);
    }
    // Nettoyage de l'effet
    return () => {
      document.body.style.overflow = ''; // Assure que le scroll est réactivé si le composant est démonté
    };
  }, [isOpen]);

  // Fonction pour gérer le piège de focus
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


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guildName.trim() === '') {
      setError('Le nom de la guilde ne peut pas être vide.');
      return;
    }
    setError(null);
    onCreate(guildName);
  };

  if (!isOpen) {
    return null;
  }

  return (
    // Ajoutez le ref au conteneur de la modale et role="dialog" + aria-modal
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title" // Lier au titre de la modale
        ref={modalRef} // Attachez la référence ici
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title">Créer une nouvelle Guilde</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="guildName">Nom de la Guilde :</label>
            <input
              type="text"
              id="guildName"
              value={guildName}
              onChange={(e) => setGuildName(e.target.value)}
              placeholder="Ex: La Légion d'Aurelia"
              required
              ref={firstFocusableElementRef} // Attachez la référence au champ de saisie
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

export default GuildCreationModal;