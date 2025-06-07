import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="app-header">
      <nav>
        {/* Groupe de gauche */}
        <ul className="nav-left">
          <li>
            <Link to="/">Accueil</Link>
          </li>
        </ul>

        {/* Groupe de droite */}
        <ul className="nav-right">
          <li>
            <Link to="/guild-management">Gestion de Guilde</Link>
          </li>
          <li>
            <Link to="/account-management">Gestion de Compte</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;