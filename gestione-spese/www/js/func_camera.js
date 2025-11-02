// Helper: opzioni camera “sicure”
function cameraOptions(sourceType) {
  return {
    quality: 80,
    destinationType: Camera.DestinationType.FILE_URI, // ottieni file:// o content://
    sourceType, // CAMERA o PHOTOLIBRARY
    allowEdit: false, // deprecato nei nuovi rilasci
    correctOrientation: true,
    saveToPhotoAlbum: false,
    mediaType: Camera.MediaType.PICTURE,
    encodingType: Camera.EncodingType.JPEG,
    targetWidth: 1024, // riduci un po' le dimensioni per risparmiare spazio
    targetHeight: 1024,
  };
}

// Entrypoint: scatta o scegli
function chooseAvatar(fromCamera = false) {
  return new Promise((resolve, reject) => {
    if (!navigator.camera) {
      return reject(new Error("Camera non disponibile (deviceready?)"));
    }

    const src = fromCamera
      ? Camera.PictureSourceType.CAMERA
      : Camera.PictureSourceType.PHOTOLIBRARY;

    navigator.camera.getPicture(
      (uri) => resolve(uri), // es. file:///...jpg o content://...
      (err) => reject(new Error("Errore camera: " + err)),
      cameraOptions(src)
    );
  });
}

// Copia il file nella sandbox dell’app e ritorna il nuovo path
function copyToAppDataDirectory(fileUri) {
  return new Promise((resolve, reject) => {
    // cartella sandbox scrivibile dell’app
    const targetDir = cordova.file.dataDirectory;

    // Risolvi il FileEntry della sorgente
    window.resolveLocalFileSystemURL(
      fileUri,
      (srcEntry) => {
        // Risolvi la DirectoryEntry di destinazione
        window.resolveLocalFileSystemURL(
          targetDir,
          (dstDir) => {
            // Genera un nome file
            const newName = "avatar_" + Date.now() + ".jpg";
            // Copia
            srcEntry.copyTo(
              dstDir,
              newName,
              (newEntry) => {
                resolve(newEntry.toURL()); // file:///.../avatar_123456.jpg
              },
              (copyErr) => reject(copyErr)
            );
          },
          (e) => reject(e)
        );
      },
      (e) => reject(e)
    );
  });
}

// Salva il path in IndexedDB con la tua utility generica
function saveAvatarPathToDB(localPath) {
  // Assicurati che lo store "profile" esista in openDB() (come fai per settings)
  return saveGenericData(STORE_PROFILE, KEY_AVATAR_PATH, {
    value: localPath,
  });
}

// Carica il path da IndexedDB
function getAvatarPathFromDB() {
  return new Promise((resolve, reject) => {
    if (!window._dbHandle) return resolve(null);

    const db = window._dbHandle;
    const tx = db.transaction(STORE_PROFILE, "readonly");
    const store = tx.objectStore(STORE_PROFILE);
    const req = store.get(KEY_AVATAR_PATH);
    req.onsuccess = (ev) => {
      const rec = ev.target.result;
      resolve(rec ? rec.value : null);
    };
    req.onerror = (err) => reject(err);
  });
}

// Aggiorna lo stato e la preview
function applyAvatar(localPath) {
  const img = document.getElementById("avatarPreview");
  const btnRemove = document.getElementById("btnRemovePhoto");

  // Aggiorna l'immagine
  if (img) img.src = localPath || "";

  // Mostra/nascondi il bottone di rimozione
  if (btnRemove) {
    if (localPath && localPath.length > 0) {
      btnRemove.style.display = "inline-flex"; // o "block" se preferisci
    } else {
      btnRemove.style.display = "none";
    }
  }

  // Stato in RAM
  CURRENT_APP_DATA = CURRENT_APP_DATA || {};
  CURRENT_APP_DATA.profile = CURRENT_APP_DATA.profile || {};
  CURRENT_APP_DATA.profile.avatarPath = localPath;
}

// Flusso completo: scegli/scatta -> copia -> salva -> mostra
async function handleSetAvatar(fromCamera) {
  try {
    const srcUri = await chooseAvatar(!!fromCamera);
    const localPath = await copyToAppDataDirectory(srcUri);
    await saveAvatarPathToDB(localPath);
    applyAvatar(localPath);
    if (APP_DEBUG?.SHOWCONSOLELOG) console.log("[avatar] Salvato:", localPath);
  } catch (e) {
    console.error("[avatar] Errore:", e);
    // opzionale: mostrare toast/alert
  }
}

// Rimuove l’avatar: cancella file e stato
async function handleRemoveAvatar() {
  try {
    const path =
      CURRENT_APP_DATA?.profile?.avatarPath || (await getAvatarPathFromDB());
    if (path) {
      await deleteLocalFile(path); // sotto
    }
    await saveAvatarPathToDB(null);
    applyAvatar(null);
  } catch (e) {
    console.warn("[avatar] Rimozione, errore:", e);
  }
}

// Elimina un file locale dato l’URL (file:///…)
function deleteLocalFile(fileUrl) {
  return new Promise((resolve, reject) => {
    window.resolveLocalFileSystemURL(
      fileUrl,
      (fileEntry) => {
        fileEntry.remove(
          () => resolve(),
          (err) => reject(err)
        );
      },
      (e) => {
        // se non risolvibile, consideriamo già rimosso
        resolve();
      }
    );
  });
}

// Inizializza i bottoni e carica l’avatar salvato all’avvio
function initProfileSection() {
  const btnTake = document.getElementById("btnTakePhoto");

  const btnPick = document.getElementById("btnPickPhoto");
  const btnRemove = document.getElementById("btnRemovePhoto");

  if (btnTake) btnTake.addEventListener("click", () => handleSetAvatar(true));
  if (btnPick) btnPick.addEventListener("click", () => handleSetAvatar(false));
  if (btnRemove) btnRemove.addEventListener("click", handleRemoveAvatar);

  // Carica avatar salvato
  getAvatarPathFromDB().then((p) => {
    if (p) applyAvatar(p);
  });
}

// Esempio: richiamala nel controller della pagina profilo/impostazioni
// dentro runPageController('settings') o simile:
function initSettingsPage_camera() {
  // ...il tuo codice esistente...
  initProfileSection();
}

function checkcamera() {
  console.log("funziona");
}
