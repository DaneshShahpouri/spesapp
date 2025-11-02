function renderHomePage() {
  try {
    //database e funzioni di init camera per foto utente
    let db = CURRENT_APP_DATA;
    let data_corrente = "";
    console.log("db", db);

    initSettingsPage_camera();

    const isVisible_start =
      db.settings?.saldo_visibile === true ||
      db.settings?.saldo_visibile === "true";

    toggleSaldoVisibility(isVisible_start);

    setInterval(() => {
      SetData();
    }, DATEDB.INTERVALTIME_CHECK); // <--  DATEDB.INTERVALTIME_MIN(classica) // DATEDB.INTERVALTIME_CHECK(debug))

    SetData();

    // home.js

    function SetData() {
      const data = getDateInfo_start();
      data_corrente = data;
      const el = document.getElementById("footer-date"); // esempio
      if (!el) return; // se la pagina non è pronta, esci silenziosamente
      el.innerText = data.stringaCompleta;
    }

    function renderHomePage() {
      // usa requestAnimationFrame per assicurarti che la page-view sia nel DOM definitivo
      requestAnimationFrame(() => {
        SetData();
        // se hai timers/intervals, valuta di (ri)istanziare solo se non già attivi
      });
    }

    //Nome Utente - Logica
    const el_inputnome = document.getElementById("nomeContatto_benvenuto");

    if (el_inputnome) {
      // leggo dal tuo stato globale (popolato in initApp -> readAllInitialData)
      const nome = CURRENT_APP_DATA?.settings?.nome || "";

      if (nome && nome.length > 0) {
        el_inputnome.value = nome; // <-- value, non innerText
      }

      // salva NOME UTENTE
      el_inputnome.addEventListener("change", async () => {
        const nuovo_valore = el_inputnome.value.trim();

        if (nuovo_valore != nome) {
          try {
            // salva nello store settings in modo coerente con theme: { value: ... }
            await saveGenericData(STORE_SETTINGS, "nomeUtente", {
              value: nuovo_valore,
            });
            // aggiorna anche lo stato in RAM per riflettere subito il cambiamento
            CURRENT_APP_DATA.settings.nome = nuovo_valore;
          } catch (e) {
            console.error("Errore salvataggio nomeUtente:", e);
          }
        }
      });
    }
    //fine - Nome Utente - Logica

    //Saldo Visibile
    const BtnSaldoVisibile = document.getElementById("btn-saldo_visibile");
    const elvalorevisibile = document.getElementById("issaldovisibile");
    BtnSaldoVisibile.addEventListener("click", async () => {
      const isVisible =
        CURRENT_APP_DATA?.settings?.saldo_visibile === true ||
        CURRENT_APP_DATA?.settings?.saldo_visibile === "true";
      // normalizza in booleano

      const newValue = !isVisible;
      console.log("DB:", db);

      try {
        await saveGenericData(STORE_SETTINGS, "saldo_visibile", {
          value: newValue,
        });
        CURRENT_APP_DATA.settings.saldo_visibile = newValue;
        console.log("Saldo visibile aggiornato:", newValue);

        // aggiorna la UI
        toggleSaldoVisibility(newValue);
      } catch (e) {
        console.error("Errore salvataggio saldo_visibile:", e);
      }
    });
    //fine Saldo Visibile

    // Aggiungi spesa Dashboard
    let btn_addnew_saldo = document.getElementById("addPay_home");
    btn_addnew_saldo.addEventListener("click", () => {
      console.log(data_corrente);
      //Check SWAL FIRE
      // --- util pro importo ---
      const MAX_CENTS = 100000000; // 1.000.000,00 €
      const MIN_CENTS = 0;

      function parseToCents(str) {
        if (typeof str !== "string") return { ok: false, reason: "empty" };
        const cleaned = str
          .replace(/\s/g, "")
          .replace(/[^0-9,.\-]/g, "")
          .replace(/(,|\.)/g, "."); // normalizza a punto

        const parts = cleaned.split(".");
        if (parts.length > 2) return { ok: false, reason: "multi-sep" };

        let sign = 1;
        let intPart = cleaned;
        let fracPart = "";

        if (cleaned.startsWith("-")) {
          sign = -1;
          intPart = intPart.slice(1);
        }

        if (parts.length === 2) {
          intPart = parts[0] || "0";
          fracPart = parts[1];
          if (fracPart.length > 2)
            return { ok: false, reason: "too-many-decimals" };
        }

        if (!/^\d+$/.test(intPart || "0"))
          return { ok: false, reason: "invalid-int" };
        if (fracPart && !/^\d{1,2}$/.test(fracPart))
          return { ok: false, reason: "invalid-frac" };

        const fracNorm = (fracPart + "00").slice(0, 2);
        const cents =
          sign *
          (parseInt(intPart || "0", 10) * 100 + parseInt(fracNorm || "0", 10));
        return { ok: true, cents };
      }

      function formatVisibleFromCents(cents) {
        const abs = Math.abs(cents) / 100;
        const formatted = new Intl.NumberFormat("it-IT", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(abs);
        return (cents < 0 ? "-" : "") + formatted;
      }

      function validateAndSyncImporto(el, hidden, fromBlur = false) {
        const raw = el.value;

        function setError(msg) {
          el.setCustomValidity(msg || "");
          el.reportValidity();
        }

        if (!raw.trim()) {
          hidden.value = "";
          setError("L'importo è obbligatorio");
          return false;
        }

        const { ok, cents, reason } = parseToCents(raw);
        if (!ok) {
          const map = {
            "multi-sep": "Usa un solo separatore decimale (virgola o punto).",
            "too-many-decimals": "Sono ammessi al massimo 2 decimali.",
            "invalid-int": "Parte intera non valida.",
            "invalid-frac": "Decimali non validi.",
            empty: "L'importo è obbligatorio.",
          };
          setError(map[reason] || "Importo non valido.");
          return false;
        }

        if (cents < MIN_CENTS) {
          setError("L'importo non può essere negativo.");
          return false;
        }
        if (cents > MAX_CENTS) {
          setError("Importo troppo alto (max 1.000.000,00).");
          return false;
        }

        hidden.value = String(cents);
        setError("");

        if (fromBlur) el.value = formatVisibleFromCents(cents);
        return true;
      }

      // --- helper data corrente ---
      const dataOggiISO = `${data_corrente.anno}-${data_corrente.meseNumero}-${data_corrente.giornoNumeroPad}`;

      Swal.fire({
        title: "Nuovo Movimento",
        html: `
    <div class="_grid">
      <fieldset class="_col-12">
        <label for="tipo-mov">Tipo</label>
        <select id="tipo-mov">
          <option value="uscita">in uscita</option>
          <option value="entrata">in entrata</option>
        </select>
      </fieldset>

      <fieldset class="_col-12">
        <label for="causale">Causale</label>
        <input id="causale" name="causale" placeholder="causale" value="nuova spesa">
      </fieldset>

      <fieldset class="_col-12">
        <label for="data-pag">Data pagamento</label>
        <input type="date" id="data-pag" name="datapagamento" value="${dataOggiISO}">
        <input type="hidden" id="data-ins" name="datainserimento" value="${dataOggiISO}">
      </fieldset>

      <fieldset class="_col-12">
        <label for="importo">Importo (€)</label>
        <input
          id="importo"
          name="importo_vis"
          type="text"
          inputmode="decimal"
          placeholder="0,00"
          aria-describedby="importoHelp"
          required
          autocomplete="off"
        />
        <small id="importoHelp">Formato: es. 12,34 — max 1.000.000,00</small>
        <input type="hidden" id="importo_cent" name="importo_cent" />
      </fieldset>
    </div>
  `,
        showCancelButton: true,
        confirmButtonText: "Conferma",
        cancelButtonText: "Annulla",
        focusConfirm: false,

        didOpen: () => {
          const el = document.getElementById("importo");
          const hidden = document.getElementById("importo_cent");

          // input live clean + soft-validate
          el.addEventListener("input", () => {
            const before = el.value;
            const cleaned = before.replace(/[^\d,.\-]/g, "");
            if (before !== cleaned) el.value = cleaned;
            validateAndSyncImporto(el, hidden, false);
          });

          // editing comodo
          el.addEventListener("focus", () => {
            const cents = parseInt(hidden.value || "", 10);
            if (!Number.isNaN(cents)) {
              const abs = Math.abs(cents);
              const raw = (abs / 100).toFixed(2).replace(".", ","); // stile IT
              el.value = (cents < 0 ? "-" : "") + raw;
              el.setCustomValidity("");
            }
            el.select?.();
          });

          // format finale
          el.addEventListener("blur", () => {
            validateAndSyncImporto(el, hidden, true);
          });
        },

        preConfirm: () => {
          // Prendi i campi
          const tipo = document.getElementById("tipo-mov").value;
          const causale = document.getElementById("causale").value.trim();
          const data_pag = document.getElementById("data-pag").value;
          const data_ins = document.getElementById("data-ins").value;

          const el = document.getElementById("importo");
          const hidden = document.getElementById("importo_cent");

          // Validazioni di base
          if (!tipo || (tipo !== "entrata" && tipo !== "uscita")) {
            Swal.showValidationMessage("Seleziona un tipo valido.");
            return false;
          }
          if (!causale) {
            Swal.showValidationMessage("Inserisci una causale.");
            return false;
          }
          if (!data_pag) {
            Swal.showValidationMessage("Inserisci la data di pagamento.");
            return false;
          }
          if (!validateAndSyncImporto(el, hidden, true)) {
            // il messaggio è già mostrato da setCustomValidity/reportValidity
            return false;
          }

          const importo_cent = parseInt(hidden.value, 10);
          return {
            tipo,
            causale,
            data_pagamento: data_pag,
            data_inserimento: data_ins,
            importo_cent,
          };
        },
      }).then((result) => {
        if (result.isConfirmed) {
          const m = result.value; // { tipo, causale, data_pagamento, data_inserimento, importo_cent }

          // TODO: integra con i tuoi dati (esempio)
          // dati.spese.push({ id: genId(), ...m, nota: m.causale, creato_il: new Date().toISOString(), aggiornato_il: new Date().toISOString() });
          // dati.metaSpese.conteggioSpese = dati.spese.length;
          // addToIndex(dati.index ??= { byYearMonth: {} }, { id: ..., data: m.data_pagamento });

          Swal.fire({
            icon: "success",
            title: "Movimento aggiunto",
            html: `
        <div style="text-align:left">
          <div><b>Tipo:</b> ${m.tipo}</div>
          <div><b>Causale:</b> ${m.causale}</div>
          <div><b>Data:</b> ${m.data_pagamento}</div>
          <div><b>Importo:</b> € ${(m.importo_cent / 100).toFixed(2)}</div>
        </div>
      `,
          });
        } else if (result.isDismissed) {
          Swal.fire("Operazione annullata", "", "info");
        }
      });
    });
    //fine  Aggiungi spesa Dashboard

    // Resto del codice...
    console.log("✅ Resto del codice eseguito");
  } catch (e) {
    console.error("❌ ERRORE in renderHomePage:", e);
  }
}
