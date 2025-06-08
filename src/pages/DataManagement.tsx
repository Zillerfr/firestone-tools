// src/pages/DataManagement.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PageStyles.css'; // Vous pouvez réutiliser des styles de page existants

const DataManagement: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <h2 className="entity-title">Gestion des Données (Import / Export)</h2>
      <p>Cette page est en cours de construction.</p>
      <p>Ici, vous pourrez importer et exporter vos données de guilde, confrérie et joueur.</p>
      <button onClick={() => navigate('/')} className="button-primary">
        Retour à l'accueil
      </button>
    </div>
  );
};

export default DataManagement;