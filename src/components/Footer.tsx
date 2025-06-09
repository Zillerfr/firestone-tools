// src/components/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css'; // Nous allons créer ce fichier CSS

const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <span className="footer-text">Firestone Tools v0.10 (c) XenobiaMegami</span>
        <Link to="/data-management" className="footer-link">
          Import / Export
        </Link>
      </div>
    </footer>
  );
};

export default Footer;