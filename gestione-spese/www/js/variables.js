// ---------------------------------------------
// CONFIGURAZIONE DATABASE / STRUTTURE
// ---------------------------------------------

const DB_CONFIG = {
  name: "DB_SPESE",
  version: 2,

  stores: {
    spese: {
      name: "spese",
      options: { keyPath: "id", autoIncrement: true },
      sampleShape: {
        data: "2025-10-26", // "YYYY-MM-DD"
        ora: "11:45:36", // "HH:mm:ss"
        categoria: "cibo",
        importo: 12.5,
        descrizione: "caffe e amaro",
        nota: "pagato troppo",
      },
    },

    settings: {
      name: "settings",
      // niente keyPath -> chiave manuale (es. "theme")
      options: { autoIncrement: false },
      sampleShape: {
        // esempio record salvato:
        // key: "theme"
        // value: "dark"
      },
    },
  },
};

// alias
const STORE_SETTINGS = DB_CONFIG.stores.settings.name;

// comodo alias per evitare stringhe magiche nel codice
const STORE_SPESE = DB_CONFIG.stores.spese.name;

// stato di routing corrente
let IS_MOBILE = false; // schermata iniziale di default
let APP_ROUTE = "home2"; // schermata iniziale di default
let IS_LOADING = false; // sto caricando
let TIMEOUT_TIME = 1700; // tempo di timeout per aprire app

let CURRENT_APP_DATA = {
  spese: [],
  metaSpese: {
    primaVolta: true,
    conteggioSpese: 0,
    esempioPrimaSpesa: null,
  },
  settings: {
    theme: "light",
  },
};
// ---------------------------------------------
// Pagine NOME - runPageController(pageName)
// ---------------------------------------------

const PAG1 = "home";
const PAG2 = "mese";
const PAG3 = "settings";

// ---------------------------------------------
// CONFIGURAZIONE DEBUG / TEST
// ---------------------------------------------

const APP_DEBUG = {
  FORCE_DB_ERROR: false, // se true → finge un errore DB
  FORCE_EMPTY_DB: false, // se true → simula DB vuoto
  SHOWCONSOLELOG: false, // se true → simula DB vuoto
  BLOCCA_LOGINIZIALE: false, // se true → simula DB vuoto
  FALLISCI_LOGINIZIALE: false, // se true → simula DB vuoto
};
