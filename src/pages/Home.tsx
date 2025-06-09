// src/pages/Home.tsx
import React, { useEffect, useState, useCallback, useContext } from 'react';
import AureliaFairy from '../assets/img/AureliaFairy.webp';
import './Home.css';
import { guildService } from '../services/guildService';
import { fellowshipService } from '../services/fellowshipService';
import type { Guild, Fellowship /*, Player*/ } from '../types/data'; // <-- Supprimez Player de l'import
import GuildCreationModal from '../components/GuildCreationModal';
import FellowshipCreationModal from '../components/FellowshipCreationModal';
import { GuildContext } from '../contexts/GuildContext';
import { FellowshipContext } from '../contexts/FellowshipContext';

const Home: React.FC = () => {
  const { selectedGuildId, setSelectedGuildId } = useContext(GuildContext);
  const { selectedFellowshipId, setSelectedFellowshipId } = useContext(FellowshipContext);

  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [fellowships, setFellowships] = useState<Fellowship[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isGuildCreationModalOpen, setIsGuildCreationModalOpen] = useState<boolean>(false);
  const [isFellowshipCreationModalOpen, setIsFellowshipCreationModalOpen] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const fetchedGuilds = await guildService.getAllGuilds();
      setGuilds(fetchedGuilds);
      if (selectedGuildId && !fetchedGuilds.some(g => g.id === selectedGuildId)) {
        setSelectedGuildId(null);
      }

      const fetchedFellowships = await fellowshipService.getAllFellowships();
      setFellowships(fetchedFellowships);
      if (selectedFellowshipId && !fetchedFellowships.some(f => f.id === selectedFellowshipId)) {
        setSelectedFellowshipId(null);
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  }, [selectedGuildId, setSelectedGuildId, selectedFellowshipId, setSelectedFellowshipId /*, selectedPlayerId, setSelectedPlayerId*/]); // Mettez à jour les dépendances

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateGuild = async (guildName: string) => {
    try {
      const newGuild = await guildService.createGuild({ name: guildName });
      console.log('Nouvelle guilde créée:', newGuild);
      setIsGuildCreationModalOpen(false);
      await loadData();
      setSelectedGuildId(newGuild.id);
    } catch (err) {
      console.error('Erreur lors de la création de la guilde:', err);
      setError('Impossible de créer la guilde.');
    }
  };

  const handleCreateFellowship = async (fellowshipName: string) => {
    try {
      const newFellowship = await fellowshipService.createFellowship({ name: fellowshipName });
      console.log('Nouvelle confrérie créée:', newFellowship);
      setIsFellowshipCreationModalOpen(false);
      await loadData();
      setSelectedFellowshipId(newFellowship.id);
    } catch (err) {
      console.error('Erreur lors de la création de la confrérie:', err);
      setError('Impossible de créer la confrérie.');
    }
  };

  if (loading) return <p>Chargement des données...</p>;
  if (error) return <p style={{ color: 'red' }}>Erreur: {error}</p>;

  return (
    <div className="home-container">
      <h1 className="home-title">Gestion de Guilde/Confrérie<br/>Firestone Idle RPG</h1>
      <img
        src={AureliaFairy}
        alt="Aurelia Fairy"
        className="home-logo"
      />

      {/* Section de sélection de Guilde */}
      <div className="selection-section">
        <label htmlFor="guild-select">Sélectionner une Guilde : </label>
        <select
          id="guild-select"
          value={selectedGuildId || ''}
          onChange={(e) => setSelectedGuildId(e.target.value || null)}
          disabled={guilds.length === 0 && !selectedGuildId}
          className="select-dropdown"
        >
          {guilds.length === 0 ? (
            <option value="">Aucune guilde disponible</option>
          ) : (
            <option value="">-- Sélectionnez une guilde --</option>
          )}
          {guilds.map((guild) => (
            <option key={guild.id} value={guild.id}>
              {guild.name}
            </option>
          ))}
        </select>
        <button onClick={() => setIsGuildCreationModalOpen(true)} className="add-button">
          Ajouter une Guilde
        </button>
      </div>

      {/* Section de sélection de Confrérie */}
      <div className="selection-section">
        <label htmlFor="fellowship-select">Sélectionner une Confrérie : </label>
        <select
          id="fellowship-select"
          value={selectedFellowshipId || ''}
          onChange={(e) => setSelectedFellowshipId(e.target.value || null)}
          disabled={fellowships.length === 0 && !selectedFellowshipId}
          className="select-dropdown"
        >
          {fellowships.length === 0 ? (
            <option value="">Aucune confrérie disponible</option>
          ) : (
            <option value="">-- Sélectionnez une confrérie --</option>
          )}
          {fellowships.map((fellowship) => (
            <option key={fellowship.id} value={fellowship.id}>
              {fellowship.name}
            </option>
          ))}
        </select>
        <button onClick={() => setIsFellowshipCreationModalOpen(true)} className="add-button">
          Ajouter une Confrérie
        </button>
      </div>

      {/* Popin de création de guilde */}
      <GuildCreationModal
        isOpen={isGuildCreationModalOpen}
        onClose={() => setIsGuildCreationModalOpen(false)}
        onCreate={handleCreateGuild}
      />

      {/* Popin de création de confrérie */}
      <FellowshipCreationModal
        isOpen={isFellowshipCreationModalOpen}
        onClose={() => setIsFellowshipCreationModalOpen(false)}
        onCreate={handleCreateFellowship}
      />
    </div>
  );
};

export default Home;