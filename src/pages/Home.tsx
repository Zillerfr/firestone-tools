import React, { useEffect, useState, useCallback, useContext } from 'react';
import AureliaFairy from '../assets/img/AureliaFairy.webp';
import './Home.css';
import { guildService } from '../services/guildService';
import { fellowshipService } from '../services/fellowshipService'; // Import du service de confrérie
import type { Guild, Fellowship } from '../types/data'; // Import de Fellowship
import GuildCreationModal from '../components/GuildCreationModal';
import FellowshipCreationModal from '../components/FellowshipCreationModal'; // Import de la nouvelle modale
import { GuildContext } from '../contexts/GuildContext';
import { FellowshipContext } from '../contexts/FellowshipContext'; // Import du contexte de confrérie

const Home: React.FC = () => {
  const { selectedGuildId, setSelectedGuildId } = useContext(GuildContext);
  const { selectedFellowshipId, setSelectedFellowshipId } = useContext(FellowshipContext); // Utilisez le contexte de confrérie

  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [fellowships, setFellowships] = useState<Fellowship[]>([]); // Nouvel état pour les confréries
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isGuildCreationModalOpen, setIsGuildCreationModalOpen] = useState<boolean>(false); // Renommé pour clarté
  const [isFellowshipCreationModalOpen, setIsFellowshipCreationModalOpen] = useState<boolean>(false); // Nouvel état pour la modale de confrérie

  // Fonction pour charger les guildes ET les confréries
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Réinitialiser les erreurs

      // Chargement des guildes
      const fetchedGuilds = await guildService.getAllGuilds();
      setGuilds(fetchedGuilds);
      if (selectedGuildId && !fetchedGuilds.some(g => g.id === selectedGuildId)) {
        setSelectedGuildId(null); // Désélectionne si la guilde n'existe plus
      } else if (!selectedGuildId && fetchedGuilds.length > 0) {
        // Optionnel : Vous pourriez auto-sélectionner la première guilde si aucune n'est choisie
        // setSelectedGuildId(fetchedGuilds[0].id);
      }

      // Chargement des confréries
      const fetchedFellowships = await fellowshipService.getAllFellowships();
      setFellowships(fetchedFellowships);
      if (selectedFellowshipId && !fetchedFellowships.some(f => f.id === selectedFellowshipId)) {
        setSelectedFellowshipId(null); // Désélectionne si la confrérie n'existe plus
      } else if (!selectedFellowshipId && fetchedFellowships.length > 0) {
        // Optionnel : Vous pourriez auto-sélectionner la première confrérie si aucune n'est choisie
        // setSelectedFellowshipId(fetchedFellowships[0].id);
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  }, [selectedGuildId, setSelectedGuildId, selectedFellowshipId, setSelectedFellowshipId]); // Dépend de tous les IDs et setters des contextes

  // Effet pour charger les données au montage
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Gérer la création d'une nouvelle guilde
  const handleCreateGuild = async (guildName: string) => {
    try {
      const newGuild = await guildService.createGuild({ name: guildName });
      console.log('Nouvelle guilde créée:', newGuild);
      setIsGuildCreationModalOpen(false); // Ferme la popin
      await loadData(); // Recharge toutes les données (guildes et confréries)
      setSelectedGuildId(newGuild.id); // Sélectionne la nouvelle guilde
    } catch (err) {
      console.error('Erreur lors de la création de la guilde:', err);
      setError('Impossible de créer la guilde.');
    }
  };

  // Gérer la création d'une nouvelle confrérie
  const handleCreateFellowship = async (fellowshipName: string) => {
    try {
      const newFellowship = await fellowshipService.createFellowship({ name: fellowshipName });
      console.log('Nouvelle confrérie créée:', newFellowship);
      setIsFellowshipCreationModalOpen(false); // Ferme la popin
      await loadData(); // Recharge toutes les données
      setSelectedFellowshipId(newFellowship.id); // Sélectionne la nouvelle confrérie
    } catch (err) {
      console.error('Erreur lors de la création de la confrérie:', err);
      setError('Impossible de créer la confrérie.');
    }
  };

  if (loading) return <p>Chargement des données...</p>;
  if (error) return <p style={{ color: 'red' }}>Erreur: {error}</p>;

  return (
    <div className="home-container">
      <img
        src={AureliaFairy}
        alt="Aurelia Fairy"
        className="home-logo"
      />
      <h1>Outils pour Firestone Idle RPG</h1>

      {/* Section de sélection de Guilde */}
      <div className="selection-section"> {/* Utiliser une classe générique pour les sections de sélection */}
        <label htmlFor="guild-select">Sélectionner une Guilde : </label>
        <select
          id="guild-select"
          value={selectedGuildId || ''}
          onChange={(e) => setSelectedGuildId(e.target.value || null)}
          disabled={guilds.length === 0 && !selectedGuildId} // Désactiver si aucune guilde et rien de sélectionné
          className="select-dropdown" // Ajoutez une classe pour le style
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
        <button onClick={() => setIsGuildCreationModalOpen(true)} className="add-button"> {/* Utilisez une classe générique */}
          Ajouter une Guilde
        </button>
      </div>

      {/* Nouvelle Section de sélection de Confrérie */}
      <div className="selection-section">
        <label htmlFor="fellowship-select">Sélectionner une Confrérie : </label>
        <select
          id="fellowship-select"
          value={selectedFellowshipId || ''}
          onChange={(e) => setSelectedFellowshipId(e.target.value || null)}
          disabled={fellowships.length === 0 && !selectedFellowshipId} // Désactiver si aucune confrérie et rien de sélectionné
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

      {/* Nouvelle Popin de création de confrérie */}
      <FellowshipCreationModal
        isOpen={isFellowshipCreationModalOpen}
        onClose={() => setIsFellowshipCreationModalOpen(false)}
        onCreate={handleCreateFellowship}
      />
    </div>
  );
};

export default Home;