// src/pages/ChaosRiftLoot.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { guildService } from '../services/guildService';
import { playerService } from '../services/playerService';
import type { Player } from '../types/data';
import './PageStyles.css'; // Styles généraux de la page
import './ChaosRiftLoot.css'; // Styles spécifiques à cette page

interface LootRewards {
  tokens: number;
  dust: number;
  contracts: number;
  tomes: number;
}

// MISE À JOUR : Étendre l'interface PlayerLoot pour inclure les propriétés brutes
interface PlayerLoot extends Player {
  participation: number; // En pourcentage, de 0.0 à 100.0
  allocatedTokens: number;
  allocatedDust: number;
  allocatedContracts: number;
  allocatedTomes: number;
  // NOUVEAU : Propriétés pour stocker les valeurs flottantes avant arrondi et pour le tri
  rawTokens: number;
  rawDust: number;
  rawContracts: number;
  rawTomes: number;
}

const ChaosRiftLoot: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const navigate = useNavigate();

  const [guildName, setGuildName] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerLoot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // distributionRate représente le pourcentage de la part FIXE
  const [distributionRate, setDistributionRate] = useState<number>(34); // Curseur de 0 à 100

  const [monthlyRewards, setMonthlyRewards] = useState<LootRewards>({
    tokens: 0,
    dust: 0,
    contracts: 0,
    tomes: 0,
  });

  // État local pour gérer la valeur de l'input de participation pendant la saisie
  const [localParticipationInput, setLocalParticipationInput] = useState<Record<string, string>>({});


  // --- Chargement des données initiales ---
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

        // Initialise la participation et les propriétés raw/allocated pour tous les joueurs
        const playersWithLoot: PlayerLoot[] = fetchedPlayers.map(p => ({
          ...p,
          participation: 0.0, // Initialisation par défaut
          allocatedTokens: 0,
          allocatedDust: 0,
          allocatedContracts: 0,
          allocatedTomes: 0,
          rawTokens: 0, // Initialisation des rawKeys
          rawDust: 0,
          rawContracts: 0,
          rawTomes: 0,
        })).sort((a, b) => a.name.localeCompare(b.name)); // Trier par nom
        setPlayers(playersWithLoot);

        // Initialiser l'état local des inputs pour qu'ils affichent la valeur par défaut formatée
        const initialLocalInputs: Record<string, string> = {};
        playersWithLoot.forEach(p => {
          initialLocalInputs[p.id] = p.participation.toFixed(1).replace('.', ',');
        });
        setLocalParticipationInput(initialLocalInputs);

      } else {
        setError('Guilde introuvable.');
        setGuildName(null);
        setPlayers([]);
        setLocalParticipationInput({}); // Réinitialiser l'état local des inputs aussi
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Impossible de charger les données de la guilde ou des joueurs.');
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    loadGuildAndPlayers();
  }, [loadGuildAndPlayers]);


  // --- Gestion de la saisie de participation ---

  // Sélectionne tout le texte dans l'input quand il prend le focus
  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  // Met à jour la valeur de l'input localement pendant que l'utilisateur tape
  const handleLocalParticipationChange = (playerId: string, value: string) => {
    // Permet la saisie de ',' ou '.' comme séparateur décimal
    const cleanedValue = value.replace(',', '.');

    // Autorise une chaîne vide, un nombre entier ou décimal (y compris avec un point final)
    const isValidInputFormat = /^\d*\.?\d*$/.test(cleanedValue) || cleanedValue === '';

    if (!isValidInputFormat) {
      // Si l'entrée n'est pas un format valide (ex: contient des lettres), ne rien faire
      return;
    }

    setLocalParticipationInput(prev => ({
      ...prev,
      [playerId]: value, // Stocke la valeur brute de l'input (avec ',' ou '.')
    }));
  };

  // Valide et stocke la valeur finale dans l'état global lorsque l'input perd le focus
  const handleParticipationBlur = (playerId: string, value: string) => {
    const cleanedValue = value.replace(',', '.');
    let numValue = parseFloat(cleanedValue);

    // Si la valeur est NaN (ex: chaîne vide ou juste "."), la traiter comme 0
    if (isNaN(numValue) || cleanedValue === '' || cleanedValue === '.') {
      numValue = 0;
    }

    // Limiter la valeur entre 0.0 et 100.0
    const finalValue = Math.max(0, Math.min(100, numValue));

    setPlayers(prevPlayers =>
      prevPlayers.map(player =>
        player.id === playerId
          ? { ...player, participation: finalValue } // Met à jour la valeur numérique réelle
          : player
      )
    );

    // Mettre à jour l'état local de l'input avec la valeur formatée finale (ex: 2.0 -> 2,0)
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
      [key]: isNaN(numValue) ? 0 : Math.max(0, numValue), // Assure que c'est un nombre positif
    }));
  };

  // --- Logique de calcul ---
  const calculateLootDistribution = useCallback(() => {
    const totalParticipation = players.reduce((sum, p) => sum + p.participation, 0);
    const numPlayers = players.length;

    // distributionRate est le pourcentage de la part FIXE
    const fixedRate = distributionRate / 100;
    // prorataRate est le pourcentage de la part PRORATA
    const prorataRate = (100 - distributionRate) / 100;

    // Étape 1: Calculer les parts initiales (brutes et allouées à l'entier inférieur)
    let tempPlayers: PlayerLoot[] = players.map(player => {
      let tokensCalculated = 0;
      let dustCalculated = 0;
      let contractsCalculated = 0;
      let tomesCalculated = 0;

      // Calcul de la part "Fixe"
      const fixedSharePerPlayer = numPlayers > 0
        ? {
            tokens: (monthlyRewards.tokens * fixedRate) / numPlayers,
            dust: (monthlyRewards.dust * fixedRate) / numPlayers,
            contracts: (monthlyRewards.contracts * fixedRate) / numPlayers,
            tomes: (monthlyRewards.tomes * fixedRate) / numPlayers,
          }
        : { tokens: 0, dust: 0, contracts: 0, tomes: 0 };

      // Calcul de la part "Prorata"
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
        rawTokens: totalTokens, // Stocker les valeurs flottantes pour le calcul des décimales
        rawDust: totalDust,
        rawContracts: totalContracts,
        rawTomes: totalTomes,
        allocatedTokens: Math.floor(totalTokens), // Allocation initiale à l'entier inférieur
        allocatedDust: Math.floor(totalDust),
        allocatedContracts: Math.floor(totalContracts),
        allocatedTomes: Math.floor(totalTomes),
      };
    });

    // Étape 2: Calculer les restes globaux pour chaque ressource
    const remainingTokens = monthlyRewards.tokens - tempPlayers.reduce((sum, p) => sum + p.allocatedTokens, 0);
    const remainingDust = monthlyRewards.dust - tempPlayers.reduce((sum, p) => sum + p.allocatedDust, 0);
    const remainingContracts = monthlyRewards.contracts - tempPlayers.reduce((sum, p) => sum + p.allocatedContracts, 0);
    const remainingTomes = monthlyRewards.tomes - tempPlayers.reduce((sum, p) => sum + p.allocatedTomes, 0);

    // Étape 3: Fonction pour distribuer les restes un par un
    // Utilise un type générique TPlayer qui étend PlayerLoot pour s'assurer que rawKey est accessible
    const distributeRemainder = <T extends PlayerLoot>(
        playersArray: T[],
        allocatedKey: 'allocatedTokens' | 'allocatedDust' | 'allocatedContracts' | 'allocatedTomes',
        rawKey: 'rawTokens' | 'rawDust' | 'rawContracts' | 'rawTomes',
        remainder: number
    ): T[] => {
        if (remainder <= 0) return playersArray;

        // Créer une copie triable des joueurs
        // Trier par la partie décimale décroissante (plus grande décimale d'abord)
        // En cas d'égalité de décimale, trier par participation décroissante (plus grande participation d'abord)
        const sortedPlayers = [...playersArray].sort((a, b) => {
            const decimalA = a[rawKey] - Math.floor(a[rawKey]);
            const decimalB = b[rawKey] - Math.floor(b[rawKey]);

            if (decimalB !== decimalA) {
                return decimalB - decimalA; // Décimale la plus grande en premier
            }
            return b.participation - a.participation; // Puis participation la plus grande
        });

        let currentRemainder = remainder;
        let playerIndex = 0;
        // Créer une nouvelle copie du tableau pour les modifications afin d'éviter les mutations directes de l'état original
        const resultPlayers: T[] = [...playersArray]; 

        while (currentRemainder > 0 && playerIndex < sortedPlayers.length) {
            const playerToGive = sortedPlayers[playerIndex];
            
            // Trouver l'index original du joueur dans `resultPlayers` pour modifier la bonne référence
            const playerInResult = resultPlayers.find(p => p.id === playerToGive.id);
            
            if (playerInResult) {
                playerInResult[allocatedKey] += 1; // Donne 1 élément au joueur
                currentRemainder--;
            }
            
            playerIndex++;
            // Si on a parcouru tous les joueurs et qu'il reste des éléments, on reprend du début
            if (playerIndex >= sortedPlayers.length && currentRemainder > 0) {
                playerIndex = 0;
            }
        }
        return resultPlayers;
    };

    // Étape 4: Distribuer les restes pour chaque ressource
    tempPlayers = distributeRemainder(tempPlayers, 'allocatedTokens', 'rawTokens', remainingTokens);
    tempPlayers = distributeRemainder(tempPlayers, 'allocatedDust', 'rawDust', remainingDust);
    tempPlayers = distributeRemainder(tempPlayers, 'allocatedContracts', 'rawContracts', remainingContracts);
    tempPlayers = distributeRemainder(tempPlayers, 'allocatedTomes', 'rawTomes', remainingTomes);

    setPlayers(tempPlayers); // Met à jour l'état global avec les joueurs dont les loots sont alloués
  }, [players, distributionRate, monthlyRewards]); // Dépend de players pour le tri initial


  // --- Totaux pour la dernière ligne du tableau ---
  const totals = useMemo(() => {
    return players.reduce(
      (acc, player) => ({
        tokens: acc.tokens + player.allocatedTokens,
        dust: acc.dust + player.allocatedDust,
        contracts: acc.contracts + player.allocatedContracts,
        tomes: acc.tomes + player.allocatedTomes,
        // AJOUT : Somme des participations pour la ligne de total
        totalParticipation: acc.totalParticipation + player.participation,
      }),
      // Initialiser totalParticipation à 0 dans l'accumulateur
      { tokens: 0, dust: 0, contracts: 0, tomes: 0, totalParticipation: 0 }
    );
  }, [players]);

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
      <div className="entity-header-row">
        <h2 className="entity-title">{guildName} : distribution des loots de la Faille du Chaos</h2>
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
            {/* Affichage corrigé du taux de répartition */}
            <span className="rate-value-display">
              {distributionRate}% Fixe / {100 - distributionRate}% Prorata
            </span>
          </div>
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
                      // Affiche la valeur de l'état local de l'input, non pas la valeur numérique directe
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
                {/* AFFICHAGE DE LA SOMME DES PARTICIPATIONS */}
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