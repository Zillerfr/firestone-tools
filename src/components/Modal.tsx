// src/components/Modal.tsx
import React from 'react';
import './Modal.css'; // Assurez-vous d'avoir un fichier CSS pour la modale

interface ModalProps {
    onClose: () => void;
    children: React.ReactNode;
    title?: string; // Ajout du titre pour la modale
}

const Modal: React.FC<ModalProps> = ({ onClose, children, title }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    {title && <h2>{title}</h2>}
                    <button className="modal-close-button" onClick={onClose}>
                        &times;
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;