import React, { useEffect, useState, useCallback, useContext } from 'react';
import AureliaFairy from '../assets/img/AureliaFairy.webp';
import './Home.css';
import { guildService } from '../services/guildService';
import type { Guild } from '../types/data';
import GuildCreationModal from '../components/GuildCreationModal';
import { GuildContext } from '../contexts/GuildContext'; // Importez le contexte

const Home: React.FC = () => {
  const { selectedGuildId, setSelectedGuildId } = useContext(GuildContext); // Utilisez le contexte
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreationModalOpen, setIsCreationModalOpen] = useState<boolean>(false); // Pour la popin de création

  // Fonction pour charger les guildes
  const loadGuilds = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedGuilds = await guildService.getAllGuilds();
      setGuilds(fetchedGuilds);

      // Si aucune guilde n'est sélectionnée globalement ET qu'il y a des guildes,
      // on peut choisir de présélectionner la première, ou laisser à null
      // Pour ce cas, on laisse à null pour ne pas forcer de sélection initiale si l'utilisateur n'a rien choisi
      // Si une guilde est sélectionnée globalement mais n'existe plus dans la liste, on la désélectionne
      if (selectedGuildId && !fetchedGuilds.some(g => g.id === selectedGuildId)) {
          setSelectedGuildId(null);
      } else if (!selectedGuildId && fetchedGuilds.length > 0) {
          // Si aucune guilde n'est sélectionnée au contexte et des guildes existent, on ne fait rien ici pour le moment,
          // on laisse l'utilisateur choisir ou la sélection persiste si elle était déjà faite.
          // Le défaut sera "-- Sélectionner une guilde --" si selectedGuildId est null.
      }


    } catch (err) {
      console.error('Error loading guilds:', err);
      setError('Impossible de charger les guildes.');
    } finally {
      setLoading(false);
    }
  }, [selectedGuildId, setSelectedGuildId]); // Dépend de selectedGuildId et setSelectedGuildId

  // Effet pour charger les données au montage (et quand loadGuilds change)
  useEffect(() => {
    loadGuilds();
  }, [loadGuilds]);

  // Gérer la création d'une nouvelle guilde
  const handleCreateGuild = async (guildName: string) => {
    try {
      const newGuild = await guildService.createGuild({ name: guildName });
      console.log('Nouvelle guilde créée:', newGuild);
      setIsCreationModalOpen(false); // Ferme la popin de création
      await loadGuilds(); // Recharge la liste des guildes
      setSelectedGuildId(newGuild.id); // Sélectionne la nouvelle guilde dans le contexte global
    } catch (err) {
      console.error('Erreur lors de la création de la guilde:', err);
      setError('Impossible de créer la guilde.');
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

      <div className="guild-selection-section">
        <label htmlFor="guild-select">Sélectionner une Guilde : </label>
        <select
          id="guild-select"
          // Utilise selectedGuildId du contexte pour la valeur
          value={selectedGuildId || ''}
          // Met à jour selectedGuildId du contexte
          onChange={(e) => setSelectedGuildId(e.target.value || null)}
          disabled={guilds.length === 0}
        >
          {/* Option pour désélectionner ou indiquer l'absence de choix */}
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
        <button onClick={() => setIsCreationModalOpen(true)} className="add-guild-button">
          Ajouter une Guilde
        </button>
      </div>

      {/* Popin de création de guilde (inchangée) */}
      <GuildCreationModal
        isOpen={isCreationModalOpen}
        onClose={() => setIsCreationModalOpen(false)}
        onCreate={handleCreateGuild}
      />
    </div>
  );
};

export default Home;