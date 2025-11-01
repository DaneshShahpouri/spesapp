// ---------------------------------------------
// Rilevamento ambiente (Cordova vs Browser)
// ---------------------------------------------
function isCordova() {
  return (
    typeof window.cordova !== "undefined" &&
    typeof window.cordova.platformId !== "undefined"
  );
}

// ---------------------------------------------
// Costruisce lo stato applicativo iniziale a partire
// dai dati letti dal DB (spese + settings)
// ---------------------------------------------
function buildInitialAppData(speseArray, settingsObj) {
  const primaVolta = speseArray.length === 0;

  return {
    spese: speseArray,

    metaSpese: {
      primaVolta: primaVolta,
      conteggioSpese: speseArray.length,
      esempioPrimaSpesa: speseArray[0] || null,
    },

    settings: {
      theme: settingsObj && settingsObj.theme ? settingsObj.theme : "light",
      nome: (settingsObj && settingsObj.nome) || "",
    },
  };
}

// ---------------------------------------------
// Legge tutte le info necessarie all'avvio:
// - tutte le spese
// - le impostazioni utente (tema, ecc.)
// e ritorna un unico oggetto di stato coerente
// ---------------------------------------------
function readAllInitialData(db) {
  return Promise.all([
    getAllFromStore(db, STORE_SPESE), // array completo delle spese
    getSettings(db), // { theme: "light" } ecc
  ]).then(([speseArray, settingsObj]) => {
    if (APP_DEBUG.FORCE_EMPTY_DB) {
      if (APP_DEBUG.SHOWCONSOLELOG) {
        console.warn("[readAllInitialData] Simulazione DB vuoto attivata");
      }
      speseArray = [];
    }

    return buildInitialAppData(speseArray, settingsObj);
  });
}

// ---------------------------------------------
// Inizializzazione app
// - apre/crea IndexedDB
// - legge lo stato iniziale (spese+settings)
// - ritorna { ok, error, info }
// ---------------------------------------------
function initApp() {
  if (APP_DEBUG.SHOWCONSOLELOG) {
    console.log(
      "[initApp] Avvio app in modalità:",
      isCordova() ? "Cordova" : "Browser"
    );
  }

  return openDB()
    .then((db) => {
      if (APP_DEBUG.SHOWCONSOLELOG) {
        console.log("[initApp] DB aperto:", db.name);
      }

      // salvo handle globale per poter scrivere più tardi (es. cambio tema)
      if (!window._dbHandle) {
        window._dbHandle = db;
      }

      return readAllInitialData(db);
    })
    .then((appData) => {
      if (APP_DEBUG.SHOWCONSOLELOG) {
        console.log("[initApp] Stato iniziale DB (appData):", appData);
      }

      return {
        ok: true,
        error: null,
        info: appData, // questo diventa CURRENT_APP_DATA
      };
    })
    .catch((err) => {
      if (APP_DEBUG.SHOWCONSOLELOG) {
        console.error("[initApp] Errore durante initApp:", err);
      }

      return {
        ok: false,
        error: {
          message: err && err.message ? err.message : String(err),
        },
        info: null,
      };
    });
}

// ---------------------------------------------
// Entry point runtime: viene chiamata quando
// l'ambiente è pronto (deviceready su Cordova
// o DOM pronto su browser)
// ---------------------------------------------
function onDeviceReady() {
  if (isCordova()) {
    if (APP_DEBUG.SHOWCONSOLELOG) {
      console.log(
        "Running cordova-" + cordova.platformId + "@" + cordova.version
      );
    }
  } else {
    if (APP_DEBUG.SHOWCONSOLELOG) {
      console.log("Running in browser mode (no cordova object)");
    }
  }

  // ritorno SEMPRE una Promise che risolve in { ok, error, info }
  return initApp();
}

// -----------------------------------------------------------------------------------------------------------------------------------------------------
//                                                                IndexedDB helpers
// -----------------------------------------------------------------------------------------------------------------------------------------------------

// Apre (o crea) il DB basandosi su DB_CONFIG
function openDB() {
  return new Promise((resolve, reject) => {
    if (APP_DEBUG.FORCE_DB_ERROR) {
      if (APP_DEBUG.SHOWCONSOLELOG) {
        console.warn("[openDB] Simulazione errore DB attivata");
      }
      return reject(new Error("Simulazione errore apertura DB"));
    }

    const request = window.indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (APP_DEBUG.SHOWCONSOLELOG) {
        console.log("[openDB] onupgradeneeded: controllo/creo object stores");
      }

      // crea tutti gli store dichiarati in DB_CONFIG
      Object.values(DB_CONFIG.stores).forEach((storeDef) => {
        if (!db.objectStoreNames.contains(storeDef.name)) {
          db.createObjectStore(storeDef.name, storeDef.options);
          if (APP_DEBUG.SHOWCONSOLELOG) {
            console.log(`[openDB] Creato store "${storeDef.name}"`);
          }
        } else {
          if (APP_DEBUG.SHOWCONSOLELOG) {
            console.log(`[openDB] Store "${storeDef.name}" già esistente`);
          }
        }
      });

      // sicurezza extra: se per qualche motivo "settings" non esiste ancora
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { autoIncrement: false });
        if (APP_DEBUG.SHOWCONSOLELOG) {
          console.log(`[openDB] Creato store "${STORE_SETTINGS}"`);
        }
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// Prende tutti i record da uno store
function getAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.getAll();

    req.onsuccess = (event) => {
      resolve(event.target.result || []);
    };

    req.onerror = (err) => {
      reject(err);
    };
  });
}

// Recupera le impostazioni dell'app (tema, ecc.)
function getSettings(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SETTINGS, "readonly");
    const store = tx.objectStore(STORE_SETTINGS);

    const out = { theme: "light", nome: "" };

    store.get("theme").onsuccess = (e) => {
      const r = e.target.result;
      if (r && typeof r.value !== "undefined") out.theme = r.value;
    };
    store.get("nomeUtente").onsuccess = (e) => {
      const r = e.target.result;
      if (r && typeof r.value !== "undefined") out.nome = r.value;
    };

    tx.oncomplete = () => resolve(out);
    tx.onerror = (err) => reject(err);
  });
}

// -----------------------------------------------------------------------------------------------------------------------------------------------------
//                                                                NAVIGAZIONE PAGINE
// -----------------------------------------------------------------------------------------------------------------------------------------------------

function navigateTo(pageName) {
  if (APP_DEBUG.SHOWCONSOLELOG) {
  }

  // gestione speciale "home2": primissimo load forzato su "home"
  if (APP_ROUTE === "home2" || APP_ROUTE !== pageName) {
    if (pageName === "home2") {
      pageName = "home";
    }

    const container = document.querySelector("#app-content");
    const oldPageEl = container.querySelector(".page-view");

    APP_ROUTE = pageName;
    const componentPath = `components/main/page-${pageName}.html`;

    // 1. Anima uscita della pagina corrente (se esiste)
    if (oldPageEl) {
      oldPageEl.classList.add("page-leave");
    }

    // 2. Aspetta la fine della transizione uscita PRIMA di sostituire il contenuto
    //    (se non c'è pagina vecchia, andiamo subito)
    const animateOut = oldPageEl
      ? waitForTransition(oldPageEl, 250)
      : Promise.resolve();

    return animateOut
      .then(() => {
        // 3. Carichiamo il nuovo HTML della pagina
        return fetch(componentPath).then((res) => res.text());
      })
      .then((newHtml) => {
        // 4. Sostituiamo il contenuto con il nuovo markup,
        //    ma lo wrappiamo in un div che possiamo animare

        container.innerHTML = `
          <div class="page-view page-enter">
            ${newHtml}
          </div>
        `;

        const newPageEl = container.querySelector(".page-view");

        // 5. Evidenzia voce attiva in navbar/footer
        highlightActiveNav(pageName);

        // 6. Lancia il controller della nuova pagina
        // 6. Lancia il controller della nuova pagina (in sicurezza)
        try {
          if (typeof runPageController === "function") {
            runPageController(pageName);
          }
        } catch (e) {
          if (APP_DEBUG.SHOWCONSOLELOG) {
            console.warn(
              "[router] runPageController ha dato errore per",
              pageName,
              e
            );
          }
        }

        // 7. Forza reflow per far partire l'animazione di ingresso
        //    (trucco: leggere offsetWidth costringe il browser a "applicare" lo stato iniziale)
        // eslint-disable-next-line no-unused-expressions
        newPageEl.offsetWidth;
        // 8. Trigger dell'animazione di entrata
        newPageEl.classList.remove("page-enter");
        newPageEl.classList.add("page-enter-active");
      })
      .catch((err) => {
        if (APP_DEBUG.SHOWCONSOLELOG) {
          console.error("[router] Errore nel caricamento pagina:", err);
        }
      });
  }

  // se sto provando a navigare alla stessa pagina e non è "home2"

  return Promise.resolve();
}

// Evidenzia l'icona/voce attiva in nav
function highlightActiveNav(activePage) {
  const navButtons = document.querySelectorAll("[data-nav]");
  navButtons.forEach((btn) => {
    const page = btn.getAttribute("data-nav");
    if (page === activePage) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// Listener per la navbar (delegato sul container)
function setupNavListeners() {
  const header = document.querySelector("#app-header");
  if (!header) return;

  header.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-nav]");
    if (!btn) return;

    const targetPage = btn.getAttribute("data-nav");
    if (!targetPage) return;

    navigateTo(targetPage);
  });
}

// TRANSIZIONE
function waitForTransition(el, fallbackMs) {
  return new Promise((resolve) => {
    let done = false;

    const cleanup = () => {
      if (done) return;
      done = true;
      el.removeEventListener("transitionend", onEnd);
      resolve();
    };

    const onEnd = (ev) => {
      if (ev.target === el) {
        cleanup();
      }
    };

    el.addEventListener("transitionend", onEnd);

    // safety timeout se per qualche motivo "transitionend" non arriva
    setTimeout(cleanup, fallbackMs || 400);
  });
}

// Controller per pagina specifica
function runPageController(pageName) {
  if (pageName === PAG1) {
    // esempio: renderizza dashboard rapida
    renderHomePage();
  }

  if (pageName === PAG2) {
    // esempio: lista movimenti mensili
    renderListaSpese();
  }

  if (pageName === PAG3) {
    // esempio: switch tema ecc.
    initSettingsPage();
  }
}

// Carica frammenti HTML (header, footer, ecc.)
function loadComponent(targetSelector, componentPath) {
  return fetch(componentPath)
    .then((res) => res.text())
    .then((html) => {
      const target = document.querySelector(targetSelector);
      if (target) {
        target.innerHTML = html;
      } else {
        if (APP_DEBUG.SHOWCONSOLELOG) {
          console.warn("Target non trovato:", targetSelector);
        }
      }
    });
}

// Funzione che avvia tutta l'app lato UI:
// 1. carica layout base (header/footer/...)
// 2. inizializza Cordova/browser e IndexedDB
// 3. carica la prima pagina
// 4. chiama afterAppReady()
function bootstrapUI() {
  return Promise.all([])
    .then(() => {
      if (APP_DEBUG.SHOWCONSOLELOG) {
        console.log("Componenti base caricati ✅");
      }

      // ora posso iniziare initApp (IndexedDB ecc.)
      return onDeviceReady();
    })
    .then((result) => {
      if (APP_DEBUG.SHOWCONSOLELOG) {
        console.log("RESULT initApp:", result);
      }

      if (!result.ok) {
        if (APP_DEBUG.SHOWCONSOLELOG) {
          console.error("DB errore ❌", result.error);
        }
        return;
      }

      if (APP_DEBUG.SHOWCONSOLELOG) {
        console.log("DB pronto ✅");
        console.log("Info iniziali:", result.info);
      }

      // Salvo lo stato globale
      CURRENT_APP_DATA = result.info;

      // Applico il tema dell'utente
      console.log("applico il tema:", CURRENT_APP_DATA.settings.theme);
      if (CURRENT_APP_DATA.settings && CURRENT_APP_DATA.settings.theme) {
        document.documentElement.setAttribute(
          "data-theme",
          CURRENT_APP_DATA.settings.theme
        );

        document.body.classList.add(CURRENT_APP_DATA.settings.theme);
      }

      // QUI: prima di caricare la pagina,
      // marchiamo già attivo il bottone della route iniziale
      highlightActiveNav("home"); // oppure APP_ROUTE normalizzato (vediamo sotto)
      showDeviceReadyMessage();

      // carico la pagina iniziale
    })
    .then(() => {
      if (!APP_DEBUG.BLOCCA_LOGINIZIALE) {
        // header e footer ORA esistono nel DOM
        setupNavListeners();

        setTimeout(() => {
          showDeviceReadyMessage();
        }, TIMEOUT_TIME - TIMEOUT_TIME / 4);

        setTimeout(() => {
          afterAppReady();
        }, TIMEOUT_TIME);
      } else {
        console.log("Blocco il log iniziale DEBUG");
      }
    })
    .catch((err) => {
      if (APP_DEBUG.SHOWCONSOLELOG) {
        console.error("Errore in bootstrapUI:", err);
      }
    });
}

// Hook chiamato quando l'app è completamente pronta
function afterAppReady() {
  // 1.fai partire il navigate
  if (!APP_DEBUG.BLOCCA_LOGINIZIALE) {
    if (typeof navigateTo === "function" && !APP_DEBUG.FALLISCI_LOGINIZIALE) {
      navigateTo(APP_ROUTE);
    }
    if (typeof startApp === "function" && !APP_DEBUG.FALLISCI_LOGINIZIALE) {
      startApp();
    }
  }
}

function addClass(el, classe) {
  el.classList.add(classe);
}

function removeClass(el, classe) {
  el.classList.remove(classe);
}

function toggleClass(el, classe) {
  el.classList.toggle(classe);
}

//check messaggio inizile di connessione al device
function showDeviceReadyMessage() {
  const box = document.getElementById("deviceready");
  if (!box) return;

  const listening = box.querySelector(".listening");
  const received = box.querySelector(".received");

  if (listening) {
    listening.style.opacity = "0";
  }
  if (received) {
    received.style.opacity = "1";
  }
}

//Salva preferenza tema DARKMODE
function saveThemePreference(theme) {
  return new Promise((resolve, reject) => {
    // 1. sicurezza: se non ho ancora il db aperto
    if (!window._dbHandle) {
      return reject(new Error("DB non inizializzato (_dbHandle mancante)"));
    }

    const db = window._dbHandle;

    // 2. apro transazione readwrite sullo store settings
    const tx = db.transaction(STORE_SETTINGS, "readwrite");
    const store = tx.objectStore(STORE_SETTINGS);

    // struttura: chiave = "theme", valore = { value: "dark" } o { value: "light" }
    const req = store.put({ value: theme }, "theme");

    req.onsuccess = () => {
      // 3. aggiorno lo stato globale in RAM
      if (!CURRENT_APP_DATA.settings) {
        CURRENT_APP_DATA.settings = {};
      }
      CURRENT_APP_DATA.settings.theme = theme;

      // 4. aggiorno il DOM per applicare il tema subito
      document.documentElement.setAttribute("data-theme", theme);
      document.body.classList.remove("dark");
      document.body.classList.remove("light");
      document.body.classList.add(theme);

      if (APP_DEBUG.SHOWCONSOLELOG) {
      }
      console.log("[saveThemePreference] Tema salvato:", theme);

      resolve(theme);
    };

    req.onerror = (err) => {
      if (APP_DEBUG.SHOWCONSOLELOG) {
        console.error("[saveThemePreference] Errore salvataggio tema:", err);
      }
      reject(err);
    };
  });
}

//Chiude il menu a tendina della navbar
function chiudiMenu(el) {
  if (IS_MOBILE && el.classList.contains("open")) {
    el.classList.remove("open");
  }
}

// Salva un dato generico in IndexedDB: (storeName, key, value)
// - storeName: nome dello store (tabella) già esistente
// - key: chiave del record
// - value: valore da salvare (qualsiasi tipo serializzabile)
function saveGenericData(storeName, key, value) {
  return new Promise((resolve, reject) => {
    // 1) sicurezza: DB aperto?
    if (!window._dbHandle) {
      return reject(new Error("DB non inizializzato (_dbHandle mancante)"));
    }

    const db = window._dbHandle;

    try {
      // 2) transazione readwrite sullo store
      console.log("provo");
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);

      // 3) put: inserisce o aggiorna il record (key fuori-linea)
      const req = store.put(value, key);

      req.onsuccess = () => {
        if (APP_DEBUG && APP_DEBUG.SHOWCONSOLELOG) {
          console.log(`[saveGenericData] Salvato su "${storeName}"`, {
            key,
            value,
          });
        }
        resolve({ store: storeName, key, value });
      };

      req.onerror = (err) => {
        if (APP_DEBUG && APP_DEBUG.SHOWCONSOLELOG) {
          console.error(
            `[saveGenericData] Errore salvataggio su "${storeName}"`,
            err
          );
        }
        reject(err);
      };
    } catch (err) {
      reject(err);
    }
  });
}
