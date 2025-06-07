import React from 'react';
import AureliaFairy from '../assets/img/AureliaFairy.webp';
import './Home.css'; // Importez le nouveau fichier CSS pour la page d'accueil

const Home: React.FC = () => {
  return (
    <div className="home-container"> {/* Ajout d'une classe pour le conteneur */}
      <img
        src={AureliaFairy}
        alt="Aurelia Fairy"
        className="home-logo" // Ajout d'une classe pour l'image
      />
      <h1>Outils pour Firestone Idle RPG</h1>
    </div>
  );
};

export default Home;