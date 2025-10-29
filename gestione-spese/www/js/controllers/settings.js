if (APP_DEBUG.SHOWCONSOLELOG) {
  console.log("logica settings");
}

function initSettingsPage() {
  const checkbox = document.getElementById("toggle-darkmode");
  if (!checkbox) {
    if (APP_DEBUG.SHOWCONSOLELOG) {
      console.warn("[initSettingsPage] toggle-darkmode non trovato");
    }
    return;
  }

  // 1. imposta lo stato iniziale dello switch in base al tema salvato
  const currentTheme =
    CURRENT_APP_DATA?.settings?.theme === "dark" ? "dark" : "light";

  checkbox.checked = currentTheme === "dark";

  // 2. quando l'utente clicca, salviamo subito nel DB
  checkbox.addEventListener("change", () => {
    const newTheme = checkbox.checked ? "dark" : "light";

    // facciamo anche una piccola UI feedback immediata
    document.documentElement.setAttribute("data-theme", newTheme);

    document.getElementById("scritta-tema-impostazioni").innerText =
      newTheme == "dark" ? "Tema Scuro" : "Tema Chiaro";

    saveThemePreference(newTheme)
      .then(() => {
        if (APP_DEBUG.SHOWCONSOLELOG) {
          console.log("[initSettingsPage] Tema aggiornato a:", newTheme);
        }
      })
      .catch((err) => {
        console.error("Errore salvataggio tema:", err);
      });
  });
}
