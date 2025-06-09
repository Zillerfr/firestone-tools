// src/pages/ChaosRiftLoot.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { guildService } from '../services/guildService';
import { playerService } from '../services/playerService';
import type { Player } from '../types/data';
import './PageStyles.css';
import './ChaosRiftLoot.css';

interface LootRewards {
  tokens: number;
  dust: number;
  contracts: number;
  tomes: number;
}

interface PlayerLoot extends Player {
  participation: number; // En pourcentage, de 0.0 à 100.0
  allocatedTokens: number;
  allocatedDust: number;
  allocatedContracts: number;
  allocatedTomes: number;
  rawTokens: number;
  rawDust: number;
  rawContracts: number;
  rawTomes: number;
}

// Nouvelle interface pour les données stockées dans le localStorage
interface GuildLootData {
  distributionRate: number;
  monthlyRewards: LootRewards;
  playersParticipation: { [playerId: string]: number };
}

// Clé de stockage dans le localStorage
const LOCAL_STORAGE_KEY = 'firestone_tools.loots';

const ChaosRiftLoot: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const navigate = useNavigate();

  const [guildName, setGuildName] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerLoot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [distributionRate, setDistributionRate] = useState<number>(34); // Par défaut à 34%
  const [monthlyRewards, setMonthlyRewards] = useState<LootRewards>({
    tokens: 0,
    dust: 0,
    contracts: 0,
    tomes: 0,
  });

  const [localParticipationInput, setLocalParticipationInput] = useState<Record<string, string>>({});

  // Fonction utilitaire pour charger les données du localStorage
  const loadLootDataFromLocalStorage = useCallback((currentGuildId: string): GuildLootData | null => {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        const parsedData: { [guildId: string]: GuildLootData } = JSON.parse(storedData);
        return parsedData[currentGuildId] || null;
      }
    } catch (e) {
      console.error("Erreur lors du chargement des données du localStorage :", e);
    }
    return null;
  }, []);

  // Fonction utilitaire pour sauvegarder les données dans le localStorage
  const saveLootDataToLocalStorage = useCallback((data: GuildLootData) => {
    if (!guildId) return; // Ne pas sauvegarder si pas de guilde

    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      const allLootData: { [guildId: string]: GuildLootData } = storedData ? JSON.parse(storedData) : {};

      allLootData[guildId] = data; // Met à jour ou ajoute les données de la guilde actuelle

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allLootData));
    } catch (e) {
      console.error("Erreur lors de la sauvegarde des données dans le localStorage :", e);
    }
  }, [guildId]);


  // --- Chargement des données initiales (incluant localStorage) ---
  const loadGuildAndPlayers = useCallback(async () => {
    if (!guildId) {
      setError('ID de guilde manquant dans l\'URL.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const guild = await guildService.getGuildById(guildId);
      if (guild) {
        setGuildName(guild.name);
        const fetchedPlayers = await playerService.getPlayersByGuildId(guildId);

        // Charger les données sauvegardées pour cette guilde
        const savedData = loadLootDataFromLocalStorage(guildId);

        const playersWithLoot: PlayerLoot[] = fetchedPlayers.map(p => {
          const participation = savedData?.playersParticipation[p.id] !== undefined
            ? savedData.playersParticipation[p.id]
            : 0.0; // Par défaut à 0.0 si non trouvé ou pas sauvegardé

          return {
            ...p,
            participation: participation,
            allocatedTokens: 0,
            allocatedDust: 0,
            allocatedContracts: 0,
            allocatedTomes: 0,
            rawTokens: 0,
            rawDust: 0,
            rawContracts: 0,
            rawTomes: 0,
          };
        }).sort((a, b) => a.name.localeCompare(b.name));
        setPlayers(playersWithLoot);

        // Mettre à jour les états avec les données chargées ou les valeurs par défaut
        setDistributionRate(savedData?.distributionRate !== undefined ? savedData.distributionRate : 34);
        setMonthlyRewards(savedData?.monthlyRewards || { tokens: 0, dust: 0, contracts: 0, tomes: 0 });

        // Initialiser l'état local des inputs avec les valeurs chargées ou par défaut formatées
        const initialLocalInputs: Record<string, string> = {};
        playersWithLoot.forEach(p => {
          initialLocalInputs[p.id] = p.participation.toFixed(1).replace('.', ',');
        });
        setLocalParticipationInput(initialLocalInputs);

      } else {
        setError('Guilde introuvable.');
        setGuildName(null);
        setPlayers([]);
        setLocalParticipationInput({});
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Impossible de charger les données de la guilde ou des joueurs.');
    } finally {
      setLoading(false);
    }
  }, [guildId, loadLootDataFromLocalStorage]);

  useEffect(() => {
    loadGuildAndPlayers();
  }, [loadGuildAndPlayers]);

  // --- Sauvegarde des données quand les états changent ---
  useEffect(() => {
    if (!guildId || players.length === 0) return; // N'enregistre pas si pas de guilde ou de joueurs

    // Collecter les participations des joueurs
    const playersParticipation: { [playerId: string]: number } = {};
    players.forEach(p => {
      playersParticipation[p.id] = p.participation;
    });

    const dataToSave: GuildLootData = {
      distributionRate,
      monthlyRewards,
      playersParticipation,
    };
    saveLootDataToLocalStorage(dataToSave);
  }, [distributionRate, monthlyRewards, players, guildId, saveLootDataToLocalStorage]);


  // --- Gestion de la saisie de participation ---
  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  const handleLocalParticipationChange = (playerId: string, value: string) => {
    const cleanedValue = value.replace(',', '.');
    const isValidInputFormat = /^\d*\.?\d*$/.test(cleanedValue) || cleanedValue === '';

    if (!isValidInputFormat) {
      return;
    }

    setLocalParticipationInput(prev => ({
      ...prev,
      [playerId]: value,
    }));
  };

  const handleParticipationBlur = (playerId: string, value: string) => {
    const cleanedValue = value.replace(',', '.');
    let numValue = parseFloat(cleanedValue);

    if (isNaN(numValue) || cleanedValue === '' || cleanedValue === '.') {
      numValue = 0;
    }

    const finalValue = Math.max(0, Math.min(100, numValue));

    setPlayers(prevPlayers =>
      prevPlayers.map(player =>
        player.id === playerId
          ? { ...player, participation: finalValue }
          : player
      )
    );

    setLocalParticipationInput(prev => ({
      ...prev,
      [playerId]: finalValue.toFixed(1).replace('.', ','),
    }));
  };


  // --- Gestion de la saisie des récompenses ---
  const handleRewardChange = (key: keyof LootRewards, value: string) => {
    const numValue = parseInt(value, 10);
    setMonthlyRewards(prevRewards => ({
      ...prevRewards,
      [key]: isNaN(numValue) ? 0 : Math.max(0, numValue),
    }));
  };

  // --- Logique de calcul (inchangée) ---
  const calculateLootDistribution = useCallback(() => {
    const totalParticipation = players.reduce((sum, p) => sum + p.participation, 0);
    const numPlayers = players.length;

    const fixedRate = distributionRate / 100;
    const prorataRate = (100 - distributionRate) / 100;

    let tempPlayers: PlayerLoot[] = players.map(player => {
      let tokensCalculated = 0;
      let dustCalculated = 0;
      let contractsCalculated = 0;
      let tomesCalculated = 0;

      const fixedSharePerPlayer = numPlayers > 0
        ? {
            tokens: (monthlyRewards.tokens * fixedRate) / numPlayers,
            dust: (monthlyRewards.dust * fixedRate) / numPlayers,
            contracts: (monthlyRewards.contracts * fixedRate) / numPlayers,
            tomes: (monthlyRewards.tomes * fixedRate) / numPlayers,
          }
        : { tokens: 0, dust: 0, contracts: 0, tomes: 0 };

      if (totalParticipation > 0 && player.participation > 0) {
        const playerRatio = player.participation / totalParticipation;
        tokensCalculated = (monthlyRewards.tokens * prorataRate * playerRatio);
        dustCalculated = (monthlyRewards.dust * prorataRate * playerRatio);
        contractsCalculated = (monthlyRewards.contracts * prorataRate * playerRatio);
        tomesCalculated = (monthlyRewards.tomes * prorataRate * playerRatio);
      }

      const totalTokens = tokensCalculated + fixedSharePerPlayer.tokens;
      const totalDust = dustCalculated + fixedSharePerPlayer.dust;
      const totalContracts = contractsCalculated + fixedSharePerPlayer.contracts;
      const totalTomes = tomesCalculated + fixedSharePerPlayer.tomes;

      return {
        ...player,
        rawTokens: totalTokens,
        rawDust: totalDust,
        rawContracts: totalContracts,
        rawTomes: totalTomes,
        allocatedTokens: Math.floor(totalTokens),
        allocatedDust: Math.floor(totalDust),
        allocatedContracts: Math.floor(totalContracts),
        allocatedTomes: Math.floor(totalTomes),
      };
    });

    const remainingTokens = monthlyRewards.tokens - tempPlayers.reduce((sum, p) => sum + p.allocatedTokens, 0);
    const remainingDust = monthlyRewards.dust - tempPlayers.reduce((sum, p) => sum + p.allocatedDust, 0);
    const remainingContracts = monthlyRewards.contracts - tempPlayers.reduce((sum, p) => sum + p.allocatedContracts, 0);
    const remainingTomes = monthlyRewards.tomes - tempPlayers.reduce((sum, p) => sum + p.allocatedTomes, 0);

    const distributeRemainder = <T extends PlayerLoot>(
        playersArray: T[],
        resourceKey: 'tokens' | 'dust' | 'contracts' | 'tomes',
        allocatedKey: 'allocatedTokens' | 'allocatedDust' | 'allocatedContracts' | 'allocatedTomes',
        rawKey: 'rawTokens' | 'rawDust' | 'rawContracts' | 'rawTomes',
        remainder: number
    ): T[] => {
        if (remainder <= 0) return playersArray;

        const sortedPlayers = [...playersArray].sort((a, b) => {
            const decimalA = a[rawKey] - Math.floor(a[rawKey]);
            const decimalB = b[rawKey] - Math.floor(b[rawKey]);

            if (decimalB !== decimalA) {
                return decimalB - decimalA;
            }
            return b.participation - a.participation;
        });

        let currentRemainder = remainder;
        let playerIndex = 0;
        const resultPlayers: T[] = [...playersArray];

        while (currentRemainder > 0 && playerIndex < sortedPlayers.length) {
            const playerToGive = sortedPlayers[playerIndex];
            
            const playerInResult = resultPlayers.find(p => p.id === playerToGive.id);
            
            if (playerInResult) {
                playerInResult[allocatedKey] += 1;
                currentRemainder--;
            }
            
            playerIndex++;
            if (playerIndex >= sortedPlayers.length && currentRemainder > 0) {
                playerIndex = 0;
            }
        }
        return resultPlayers;
    };

    tempPlayers = distributeRemainder(tempPlayers, 'tokens', 'allocatedTokens', 'rawTokens', remainingTokens);
    tempPlayers = distributeRemainder(tempPlayers, 'dust', 'allocatedDust', 'rawDust', remainingDust);
    tempPlayers = distributeRemainder(tempPlayers, 'contracts', 'allocatedContracts', 'rawContracts', remainingContracts);
    tempPlayers = distributeRemainder(tempPlayers, 'tomes', 'allocatedTomes', 'rawTomes', remainingTomes);

    setPlayers(tempPlayers);
  }, [players, distributionRate, monthlyRewards]);

  // --- Totaux pour la dernière ligne du tableau ---
  const totals = useMemo(() => {
    return players.reduce(
      (acc, player) => ({
        tokens: acc.tokens + player.allocatedTokens,
        dust: acc.dust + player.allocatedDust,
        contracts: acc.contracts + player.allocatedContracts,
        tomes: acc.tomes + player.allocatedTomes,
        totalParticipation: acc.totalParticipation + player.participation,
      }),
      { tokens: 0, dust: 0, contracts: 0, tomes: 0, totalParticipation: 0 }
    );
  }, [players]);


  // --- Fonction de Réinitialisation ---
  const handleReset = useCallback(() => {
    if (!guildId) return;

    setDistributionRate(34);
    setMonthlyRewards({
      tokens: 0,
      dust: 0,
      contracts: 0,
      tomes: 0,
    });

    setPlayers(prevPlayers => {
      const resetPlayers = prevPlayers.map(player => ({
        ...player,
        participation: 0.0,
        allocatedTokens: 0,
        allocatedDust: 0,
        allocatedContracts: 0,
        allocatedTomes: 0,
        rawTokens: 0,
        rawDust: 0,
        rawContracts: 0,
        rawTomes: 0,
      }));

      const initialLocalInputs: Record<string, string> = {};
      resetPlayers.forEach(p => {
        initialLocalInputs[p.id] = '0,0';
      });
      setLocalParticipationInput(initialLocalInputs);

      return resetPlayers;
    });

    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        const allLootData: { [guildId: string]: GuildLootData } = JSON.parse(storedData);
        delete allLootData[guildId];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allLootData));
      }
    } catch (e) {
      console.error("Erreur lors de la suppression des données du localStorage :", e);
    }
  }, [guildId]);


  // --- Affichage des messages de chargement/erreur ---
  if (loading) {
    return <p className="loading-message">Chargement de la guilde et de ses joueurs...</p>;
  }

  if (error) {
    return <p className="error-message">Erreur: {error}</p>;
  }

  if (!guildId || guildName === null) {
    return (
      <div className="page-container">
        <p className="error-message">
          Guilde introuvable ou non spécifiée. Veuillez vous assurer que l'ID de guilde est correct dans l'URL.
        </p>
        <button onClick={() => navigate('/')} className="button-primary">Retour à l'accueil</button>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Modification ici: utilisation de display: flex et justify-content: space-between */}
      <div className="entity-header-row header-with-reset-button">
        <h2 className="entity-title">{guildName} : distribution des loots de la Faille du Chaos</h2>
        {/* BOUTON DE RÉINITIALISATION DÉPLACÉ ICI */}
        <button
          onClick={handleReset}
          className="button-danger reset-button"
          title="Réinitialiser tous les champs de saisie et la répartition"
        >
          Réinitialisation
        </button>
      </div>

      <div className="distribution-control-full-width">

        <div className="distribution-slider-row">
          <span className="rate-display-label">Taux de répartition :</span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={distributionRate}
            onChange={(e) => setDistributionRate(parseInt(e.target.value, 10))}
            className="slider"
          />
          <span className="rate-value-display">
            {distributionRate}% Fixe / {100 - distributionRate}% Prorata
          </span>
        </div>
      </div>

      <div className="content-section reward-input-section">
        <h3>Récompenses du mois</h3>
        <div className="reward-inputs">
          <div className="form-group">
            <label htmlFor="tokens">Jetons</label>
            <input
              type="number"
              id="tokens"
              value={monthlyRewards.tokens}
              onChange={(e) => handleRewardChange('tokens', e.target.value)}
              min="0"
              className="reward-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="dust">Poussières</label>
            <input
              type="number"
              id="dust"
              value={monthlyRewards.dust}
              onChange={(e) => handleRewardChange('dust', e.target.value)}
              min="0"
              className="reward-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="contracts">Contrats</label>
            <input
              type="number"
              id="contracts"
              value={monthlyRewards.contracts}
              onChange={(e) => handleRewardChange('contracts', e.target.value)}
              min="0"
              className="reward-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="tomes">Tômes</label>
            <input
              type="number"
              id="tomes"
              value={monthlyRewards.tomes}
              onChange={(e) => handleRewardChange('tomes', e.target.value)}
              min="0"
              className="reward-input"
            />
          </div>
        </div>
        <button onClick={calculateLootDistribution} className="button-primary calculate-button">
          Calculer
        </button>
      </div>

      <div className="table-container">
        {players.length === 0 ? (
          <p>Aucun joueur trouvé pour cette guilde.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom du joueur</th>
                <th style={{ width: '120px' }}>Participation (%)</th>
                <th>Jetons</th>
                <th>Poussières</th>
                <th>Contrats</th>
                <th>Tômes</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id}>
                  <td>{player.name}</td>
                  <td>
                    <input
                      type="text"
                      value={localParticipationInput[player.id] || ''}
                      onChange={(e) => handleLocalParticipationChange(player.id, e.target.value)}
                      onFocus={handleInputFocus}
                      onBlur={(e) => handleParticipationBlur(player.id, e.target.value)}
                      className="participation-input"
                      min="0.0"
                      max="100.0"
                      step="0.1"
                    />
                  </td>
                  <td>{player.allocatedTokens}</td>
                  <td>{player.allocatedDust}</td>
                  <td>{player.allocatedContracts}</td>
                  <td>{player.allocatedTomes}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td>Total</td>
                <td>{totals.totalParticipation.toFixed(1).replace('.', ',')}</td>
                <td>{totals.tokens}</td>
                <td>{totals.dust}</td>
                <td>{totals.contracts}</td>
                <td>{totals.tomes}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ChaosRiftLoot;