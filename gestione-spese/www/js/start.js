function startApp() {
  //assegno db
  let db = CURRENT_APP_DATA;
  if (APP_DEBUG.SHOWCONSOLELOG) {
    console.log("qui inizia l'app con accesso al DB:", db);
  }
  //caricamento iniziale finito
  IS_LOADING = false;
  if (APP_DEBUG.SHOWCONSOLELOG) {
    console.log("carico header e footer");
  }
  if (!APP_DEBUG.BLOCCA_LOGINIZIALE) {
    Promise.all([
      loadComponent("#app-header", "components/header.html"),
      loadComponent("#app-footer", "components/footer.html"),
    ])
      .then((results) => {
        // tutte le promesse sono risolte

        // ------------------------------------------------------------------------------------------
        // ---------------------------------- inizio flusso logico ----------------------------------
        // ------------------------------------------------------------------------------------------
        if (APP_DEBUG.SHOWCONSOLELOG) {
          console.log(results);
          console.log("Parte il primo navigate");
        }
        navigateTo(APP_ROUTE);

        // Definisci la media query
        const mobileQuery = window.matchMedia("(max-width: 480px)");

        // Funzione per aprire/chiudere menu solo su mobile
        function toggleMenu() {
          if (mobileQuery.matches) {
            // Se siamo sotto i 480px
            if (APP_DEBUG.SHOWCONSOLELOG) {
              console.log("is mobile?", IS_MOBILE);
            }
            const menu = document.querySelector(".wwrapper-btn.menu");
            menu.classList.toggle("open");
          }
        }

        function checkWindowsWidth() {
          if (mobileQuery.matches) {
            IS_MOBILE = true;
          } else {
            IS_MOBILE = false;
          }
        }

        // Aggiungi evento al bottone del menu
        document
          .querySelector("#btnMenu")
          .addEventListener("click", toggleMenu);

        checkWindowsWidth();

        // (Facoltativo) Reagisci ai cambi di dimensione finestra
        mobileQuery.addEventListener("change", (e) => {
          if (!e.matches) {
            // Se torniamo sopra 480px, chiudi il menu
            document
              .querySelector(".wwrapper-btn.menu")
              .classList.remove("open");
            IS_MOBILE = false;
          } else {
            IS_MOBILE = true;
          }
        });

        //Serve a chiudere il menu SUBITO quando viene cliccato il menu a tendina del mobile
        document.querySelectorAll(".wwrapper-btn.menu>*").forEach((btn) => {
          btn.addEventListener("click", () => {
            console.log("clicco");
            chiudiMenu(document.querySelector(".wwrapper-btn.menu"));
          });
        });

        // ------------------------------------------------------------------------------------------
        // -------------------------------------fine flusso logico ----------------------------------
        // ------------------------------------------------------------------------------------------
      })
      .catch((error) => {
        // almeno una promessa è fallita
        console.error(error);
      });
  }
}
