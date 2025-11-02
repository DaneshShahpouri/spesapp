// ---------------------------------------------
// CONFIGURAZIONE DATABASE / STRUTTURE
// ---------------------------------------------

const DB_CONFIG = {
  name: "DB_SPESE",
  version: 3, // ⚠️ aumenta la versione per forzare onupgradeneeded()

  stores: {
    spese: {
      name: "spese",
      options: { keyPath: "id", autoIncrement: true },
      sampleShape: {
        data: "2025-10-26",
        ora: "11:45:36",
        categoria: "cibo",
        importo: 12.5,
        descrizione: "caffe e amaro",
        nota: "pagato troppo",
      },
    },

    settings: {
      name: "settings",
      options: { autoIncrement: false },
      sampleShape: {
        theme: "dark",
      },
    },

    // ✅ aggiungi questo blocco:
    profile: {
      name: "profile",
      options: { autoIncrement: false },
      sampleShape: {
        avatarPath:
          "file:///storage/emulated/0/Android/data/app/avatar_123.jpg",
      },
    },
  },
};

// alias
const STORE_SETTINGS = DB_CONFIG.stores.settings.name;
// Costanti per lo store e la chiave in IndexedDB

const STORE_PROFILE = DB_CONFIG.stores.profile.name;
// crea/garantisci questo store in openDB()
const KEY_AVATAR_PATH = "avatarPath"; // salveremo qui il path locale
// comodo alias per evitare stringhe magiche nel codice
const STORE_SPESE = DB_CONFIG.stores.spese.name;

// stato di routing corrente
var IS_MOBILE = false; // schermata iniziale di default
var APP_ROUTE = "home2"; // schermata iniziale di default
var IS_LOADING = false; // sto caricando
var TIMEOUT_TIME = 1700; // tempo di timeout per aprire app

var DATEDB = {
  INTERVALTIME_CHECK: 5000,
  INTERVALTIME_MIN: 1000 * 60,
};

var CURRENT_APP_DATA = {
  spese: [],
  metaSpese: {
    primaVolta: true,
    conteggioSpese: 0,
    esempioPrimaSpesa: null,
  },
  settings: {
    theme: "light",
    nome: "Nome Cognome",
    saldo_visibile: "true",
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
