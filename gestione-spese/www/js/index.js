function StartLoad() {
  console.log("inizio tutto");
}

// Avviamo bootstrapUI nel modo giusto a seconda dell'ambiente
IS_LOADING = true;

if (isCordova()) {
  document.addEventListener(
    "deviceready",
    () => {
      if (APP_DEBUG.SHOWCONSOLELOG) {
        console.log("[bootstrap] In Cordova: attendo deviceready ✅");
      }
      bootstrapUI();
    },
    false
  );
} else {
  if (APP_DEBUG.SHOWCONSOLELOG) {
    console.log(
      "[bootstrap] Browser mode: salto deviceready e lancio bootstrapUI subito"
    );
  }
  bootstrapUI();
}
