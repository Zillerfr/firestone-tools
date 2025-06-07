import React from 'react';
import './PageStyles.css'; // Importez le même fichier CSS

const AccountManagement: React.FC = () => {
  return (
    <div className="page-container"> {/* Utilisation d'une classe */}
      <h2>Gestion de Compte</h2>
      <p>Contenu de la page de gestion de compte.</p>
    </div>
  );
};

export default AccountManagement;