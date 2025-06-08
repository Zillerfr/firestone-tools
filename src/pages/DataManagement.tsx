// src/pages/DataManagement.tsx
import React, { useState } from 'react';
import ConfirmationModal from '../components/ConfirmationModal'; // Assurez-vous que ce composant existe
import './PageStyles.css'; // Styles généraux des pages

const DataManagement: React.FC = () => {

  const [exportedData, setExportedData] = useState<string>('');
  const [importData, setImportData] = useState<string>('');
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState<boolean>(false);
  const [isImportConfirmationModalOpen, setIsImportConfirmationModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const LOCAL_STORAGE_KEYS = {
    fellowships: "firestone_tools.fellowships",
    guilds: "firestone_tools.guilds",
    players: "firestone_tools.players",
  };

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  // --- Export Logic ---
  const handleExportData = () => {
    clearMessages();
    try {
      const dataToExport = {
        fellowships: localStorage.getItem(LOCAL_STORAGE_KEYS.fellowships),
        guilds: localStorage.getItem(LOCAL_STORAGE_KEYS.guilds),
        players: localStorage.getItem(LOCAL_STORAGE_KEYS.players),
      };

      // Convertir l'objet en chaîne JSON
      const jsonString = JSON.stringify(dataToExport);

      // Encoder la chaîne JSON en Base64
      const encodedData = btoa(jsonString); // `btoa` pour encoder en base64

      setExportedData(encodedData);
      setSuccessMessage('Données exportées avec succès ! Copiez le contenu ci-dessous.');
    } catch (e) {
      console.error('Erreur lors de l\'export des données:', e);
      setError('Erreur lors de l\'export des données. Veuillez réessayer.');
    }
  };

  const handleCopyExportedData = () => {
    if (exportedData) {
      navigator.clipboard.writeText(exportedData)
        .then(() => {
          setSuccessMessage('Données copiées dans le presse-papiers !');
        })
        .catch(err => {
          console.error('Échec de la copie:', err);
          setError('Échec de la copie des données.');
        });
    }
  };

  // --- Import Logic ---
  const handleImportConfirmation = () => {
    clearMessages();
    if (!importData) {
      setError('Veuillez coller les données à importer.');
      return;
    }
    setIsImportConfirmationModalOpen(true);
  };

  const handleImportData = () => {
    clearMessages();
    setIsImportConfirmationModalOpen(false); // Fermer la modale de confirmation
    try {
      // Décoder la chaîne Base64
      const decodedJsonString = atob(importData); // `atob` pour décoder du base64

      // Parser la chaîne JSON en objet
      const importedDataObject = JSON.parse(decodedJsonString);

      // Vérifier la structure des données importées (simple validation)
      if (typeof importedDataObject !== 'object' ||
          !('fellowships' in importedDataObject) ||
          !('guilds' in importedDataObject) ||
          !('players' in importedDataObject)) {
        throw new Error('Format de données importé invalide.');
      }

      // Remplacer les données dans le Local Storage
      // Les valeurs nulles ou non définies sont gérées par setItem (elles seront stockées comme "null" ou "undefined")
      // ou vous pouvez choisir de ne pas les stocker si vous préférez.
      if (importedDataObject.fellowships !== null && importedDataObject.fellowships !== undefined) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.fellowships, importedDataObject.fellowships);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.fellowships);
      }

      if (importedDataObject.guilds !== null && importedDataObject.guilds !== undefined) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.guilds, importedDataObject.guilds);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.guilds);
      }

      if (importedDataObject.players !== null && importedDataObject.players !== undefined) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.players, importedDataObject.players);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.players);
      }

      setSuccessMessage('Données importées avec succès ! La page va se recharger.');
      // Recharger la page pour que les autres composants de l'application voient les nouvelles données
      setTimeout(() => window.location.reload(), 1500);

    } catch (e: any) {
      console.error('Erreur lors de l\'import des données:', e);
      setError(`Erreur lors de l\'import des données : ${e.message || 'Format invalide'}.`);
    }
  };

  // --- Clear All Data Logic ---
  const handleClearAllDataConfirmation = () => {
    clearMessages();
    setIsClearDataModalOpen(true);
  };

  const handleClearAllData = () => {
    clearMessages();
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.fellowships);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.guilds);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.players);
      setSuccessMessage('Toutes les données ont été supprimées avec succès ! La page va se recharger.');
      setIsClearDataModalOpen(false);
      // Recharger la page pour refléter la suppression complète des données
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      console.error('Erreur lors de la suppression des données:', e);
      setError('Erreur lors de la suppression complète des données.');
    }
  };

  return (
    <div className="page-container">
      {/* Header Section - Similar to other management pages */}
      <div className="entity-header-row">
        <h2 className="entity-title">Gestion des Données (Import / Export)</h2>
        <button
          onClick={handleClearAllDataConfirmation}
          className="delete-entity-button"
          title="Supprimer toutes les données du Local Storage"
        >
          Supprimer toutes les données
        </button>
      </div>

      {/* Main Content Section */}
      <div className="content-section">
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        {/* Export Section */}
        <div className="data-section">
          <h3>Exporter les données</h3>
          <p>Cliquez sur "Exporter" pour générer un JSON Base64 de toutes vos données (guildes, confréries, joueurs).</p>
          <button onClick={handleExportData} className="button-primary">
            Exporter les données
          </button>
          {exportedData && (
            <div className="form-group" style={{ marginTop: '15px' }}>
              <label htmlFor="export-data-textarea">Données exportées (Base64) :</label>
              <textarea
                id="export-data-textarea"
                rows={10}
                value={exportedData}
                readOnly
                className="data-textarea"
              ></textarea>
              <button onClick={handleCopyExportedData} className="button-secondary" style={{ marginTop: '10px' }}>
                Copier dans le presse-papiers
              </button>
            </div>
          )}
        </div>

        <hr className="section-divider" /> {/* Visually separates sections */}

        {/* Import Section */}
        <div className="data-section">
          <h3>Importer les données</h3>
          <p>Collez ici les données JSON encodées en Base64 pour les importer. Cela **remplacera toutes les données existantes**.</p>
          <div className="form-group">
            <label htmlFor="import-data-textarea">Coller les données à importer (Base64) :</label>
            <textarea
              id="import-data-textarea"
              rows={10}
              value={importData}
              onChange={(e) => {
                setImportData(e.target.value);
                clearMessages(); // Clear messages on input change
              }}
              className="data-textarea"
              placeholder="Collez ici votre chaîne de données Base64..."
            ></textarea>
            <button onClick={handleImportConfirmation} className="button-primary" style={{ marginTop: '10px' }} disabled={!importData}>
              Importer les données
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={isClearDataModalOpen}
        onClose={() => setIsClearDataModalOpen(false)}
        onConfirm={handleClearAllData}
        message="Êtes-vous sûr de vouloir supprimer TOUTES les données (guildes, confréries, joueurs) de l'application ? Cette action est irréversible."
      />

      <ConfirmationModal
        isOpen={isImportConfirmationModalOpen}
        onClose={() => setIsImportConfirmationModalOpen(false)}
        onConfirm={handleImportData}
        message="Êtes-vous sûr de vouloir importer ces données ? Cela remplacera TOUTES les données existantes (guildes, confréries, joueurs) dans l'application. Cette action est irréversible."
      />
    </div>
  );
};

export default DataManagement;