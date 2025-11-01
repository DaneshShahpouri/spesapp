function renderHomePage() {
  //console.log("logica home", CURRENT_APP_DATA);
  let db = CURRENT_APP_DATA;

  initSettingsPage_camera();

  const el_inputnome = document.getElementById("nomeContatto_benvenuto");
  if (el_inputnome) {
    // leggo dal tuo stato globale (popolato in initApp -> readAllInitialData)
    const nome = CURRENT_APP_DATA?.settings?.nome || "";
    console.log(CURRENT_APP_DATA.settings);
    if (nome && nome.length > 0) {
      el_inputnome.value = nome; // <-- value, non innerText
    }

    el_inputnome.addEventListener("input", async () => {
      const nuovo_valore = el_inputnome.value.trim();
      try {
        // salva nello store settings in modo coerente con theme: { value: ... }
        await saveGenericData(STORE_SETTINGS, "nomeUtente", {
          value: nuovo_valore,
        });
        // aggiorna anche lo stato in RAM per riflettere subito il cambiamento
        CURRENT_APP_DATA.settings.nome = nuovo_valore;
        console.log("Salvato nomeUtente:", nuovo_valore);
        console.log("dvb:", db);
      } catch (e) {
        console.error("Errore salvataggio nomeUtente:", e);
      }
    });
  }
}
