import React from 'react';
import './PageStyles.css'; // Créez un fichier CSS commun pour les styles de page

const GuildManagement: React.FC = () => {
  return (
    <div className="page-container"> {/* Utilisation d'une classe */}
      <h2>Gestion de Guilde</h2>
      <p>Contenu de la page de gestion de guilde.</p>
    </div>
  );
};

export default GuildManagement;