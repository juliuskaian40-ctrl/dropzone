
const API = "https://fortnite-api.com";
const $ = (id) => document.getElementById(id);

let shopItems = [];
let mapData = null;
let currentMode = "br";

const colors = {
  common: "#a0a5ad",
  uncommon: "#63b85a",
  rare: "#4b9be8",
  epic: "#b56aff",
  legendary: "#e99a43",
  mythic: "#e8c64a",
  exotic: "#62d9cf",
  marvel: "#e85a63",
  dc: "#5d91ff",
  icon: "#d9d9e1",
  starwars: "#e8d66b"
};

const safe = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[c]);

async function getData(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error(`API-Fehler ${response.status}`);
  }

  const json = await response.json();

  if (json.error) {
    throw new Error(
      typeof json.error === "string"
        ? json.error
        : "Die API meldet einen Fehler."
    );
  }

  return json.data ?? json;
}

function setStatus(message) {
  const el = $("apiStatus");
  if (el) el.textContent = message;
}

function setUpdated() {
  const el = $("updated");
  if (el) {
    el.textContent = "AKTUALISIERT " +
      new Date().toLocaleTimeString("de-DE", {
        hour: "2-digit", minute: "2-digit"
      });
  }
}

function showMapError(message) {
  $("mapFrame").innerHTML =
    `<div class="loading">${safe(message)}<br><br>
    Bitte später erneut versuchen.</div>`;
  $("mapStatus").textContent = "KARTE NICHT VERFÜGBAR";
  $("poiCount").textContent = "KARTENDATEN NICHT VERFÜGBAR";
}

async function loadMap() {
  if (currentMode !== "br") return;

  const button = $("refreshMap");
  button.disabled = true;
  $("mapStatus").textContent = "KARTE WIRD GELADEN";
  $("mapFrame").innerHTML =
    '<div class="loading"><span class="spinner"></span>KARTE WIRD GELADEN</div>';

  try {
    // RICHTIG: Die Karten-API liegt unter /v1/map.
    mapData = await getData(`${API}/v1/map?language=de`);

    const images = mapData.images || {};
    const imageUrl =
      (typeof images.pois === "string" && images.pois) ||
      (typeof images.blank === "string" && images.blank) ||
      (typeof images.all === "string" && images.all) ||
      (typeof mapData.image === "string" && mapData.image);

    if (!imageUrl) {
      throw new Error("Die API liefert aktuell kein Kartenbild.");
    }

    const img = document.createElement("img");
    img.alt = "Aktuelle Fortnite Battle-Royale-Karte";
    img.loading = "eager";
    img.src = imageUrl;

    img.onload = () => {
      $("mapStatus").textContent = "KARTE VERFÜGBAR";
      $("poiCount").textContent = Array.isArray(mapData.pois)
        ? `${mapData.pois.length} BENANNTE ORTE`
        : "BATTLE-ROYALE-INSELKARTE";
      setStatus("API VERBUNDEN");
      setUpdated();
    };

    img.onerror = () => showMapError(
      "Das Kartenbild konnte nicht geladen werden."
    );

    $("mapFrame").replaceChildren(img);
  } catch (error) {
    showMapError(error.message || "Karten-API nicht erreichbar.");
    setStatus("MAP-FEHLER");
  } finally {
    button.disabled = false;
  }
}

function normalizeShop(data) {
  const entries = Array.isArray(data?.entries) ? data.entries : [];
  const result = [];

  for (const entry of entries) {
    const items = [
      ...(Array.isArray(entry.brItems) ? entry.brItems : []),
      ...(Array.isArray(entry.tracks) ? entry.tracks : []),
      ...(Array.isArray(entry.instruments) ? entry.instruments : []),
      ...(Array.isArray(entry.cars) ? entry.cars : []),
      ...(Array.isArray(entry.items) ? entry.items : []),
      ...(entry.item ? [entry.item] : [])
    ];

    if (!items.length && (entry.displayName || entry.name)) {
      items.push(entry);
    }

    const isBundle = Boolean(entry.bundle) ||
      Boolean(entry.bundleName) || items.length > 1;

    for (const item of items) {
      const rarityValue =
        item.rarity?.value ||
        item.series?.value ||
        (typeof item.rarity === "string" ? item.rarity : "common");

      const images = item.images || {};
      const rawPrice = item.price ?? item.displayPrice;
      let price = null;

      // Bundlepreise nicht als Einzelpreis ausgeben.
      if (
        !isBundle &&
        rawPrice != null &&
        Number.isFinite(Number(rawPrice))
      ) {
        price = Number(rawPrice);
      }

      result.push({
        id: item.id || item.templateId || item.name || String(result.length),
        name: item.name || item.displayName || item.title || "Unbekannt",
        type: item.type?.displayValue ||
          item.type?.value ||
          (typeof item.type === "string" ? item.type : "Item"),
        rarity: String(rarityValue).toLowerCase(),
        image: images.featured || images.icon ||
          images.smallIcon || item.image || item.icon || null,
        price,
        bundle: isBundle
      });
    }
  }

  const seen = new Set();
  return result.filter((item) => {
    const key = `${item.id}-${item.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function loadShop() {
  const button = $("refreshShop");
  button.disabled = true;
  $("shopMessage").textContent = "Der Item-Shop wird geladen …";
  $("shopMessage").classList.remove("error");

  try {
    // Der Shop-Endpunkt ist /v2/shop.
    const data = await getData(`${API}/v2/shop?language=de`);
    const items = normalizeShop(data);

    if (!items.length) {
      throw new Error("Keine Shop-Items in der API-Antwort gefunden.");
    }

    shopItems = items;
    renderShop();
    $("shopMessage").textContent = "";
    setStatus("API VERBUNDEN");
    setUpdated();
  } catch (error) {
    $("shopMessage").textContent =
      `${error.message} Bitte später erneut versuchen.`;
    $("shopMessage").classList.add("error");
    $("shopGrid").replaceChildren();
    $("itemCount").textContent = "—";
    setStatus("SHOP-FEHLER");
  } finally {
    button.disabled = false;
  }
}

function renderShop() {
  const query = $("search").value.trim().toLocaleLowerCase("de");
  const sort = $("sort").value;

  const list = shopItems.filter((item) =>
    item.name.toLocaleLowerCase("de").includes(query)
  );

  if (sort === "name") {
    list.sort((a, b) => a.name.localeCompare(b.name, "de"));
  } else if (sort === "price") {
    list.sort((a, b) =>
      (a.price ?? Infinity) - (b.price ?? Infinity)
    );
  }

  $("itemCount").textContent = String(list.length);

  $("shopGrid").innerHTML = list.map((item) => {
    const color = colors[item.rarity.replace(/[^a-z]/g, "")] || "#a855f7";
    const image = item.image
      ? `<img src="${safe(item.image)}" alt="${safe(item.name)}" loading="lazy">`
      : "";

    const price = item.price !== null
      ? `<span class="price"><span class="coin">V</span>${item.price.toLocaleString("de-DE")}</span>`
      : '<span class="price unknown">Preis n. v.</span>';

    return `
      <article class="item">
        <div class="art">
          ${image}
          <span class="type">${safe(item.type)}</span>
          <span class="rarity" style="background:${color}"></span>
        </div>
        <div class="info">
          <div class="name">${safe(item.name)}</div>
          <div class="item-bottom">
            <span class="rarity-label" style="color:${color}">
              ${safe(item.rarity)}
            </span>
            ${price}
          </div>
        </div>
      </article>`;
  }).join("");

  if (!list.length && !query) {
    $("shopMessage").textContent = "Aktuell keine Shop-Items verfügbar.";
  } else if (!list.length) {
    $("shopMessage").textContent = "Keine Items zu deiner Suche gefunden.";
  }
}

function mode(name) {
  currentMode = name;

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === name);
  });

  const reload = name === "reload";
  $("reloadNotice").classList.toggle("hidden", !reload);
  $("mapFrame").classList.toggle("hidden", reload);
  $("refreshMap").disabled = reload;

  $("mapTitle").textContent = reload ? "Reload Map" : "Battle Royale";
  $("mapSubtitle").textContent = reload
    ? "Reload-Kartendaten sind nicht verifiziert angebunden."
    : "Aktuelle Kartenansicht von Fortnite-API";
  $("mapCode").textContent = reload ? "RELOAD_BETA" : "MAP_001";

  if (reload) {
    $("mapStatus").textContent = "KEINE VERIFIZIERTEN DATEN";
    $("poiCount").textContent = "RELOAD-KARTE NICHT VERFÜGBAR";
  } else if (!mapData) {
    loadMap();
  }
}

function openTracker() {
  const player = $("playerName").value.trim();
  const platform = $("playerPlatform").value;

  if (!player) {
    $("trackerMessage").textContent = "Gib zuerst deinen Epic-Namen ein.";
    return;
  }

  // Öffnet die Profilseite; es wird keine Tracker-API simuliert.
  const url =
    `https://tracker.gg/fortnite/profile/${platform}/${encodeURIComponent(player)}/overview`;

  window.open(url, "_blank", "noopener,noreferrer");
  $("trackerMessage").textContent =
    "Tracker Network wird in einem neuen Tab geöffnet.";
}

$("refreshMap").addEventListener("click", loadMap);
$("refreshShop").addEventListener("click", loadShop);
$("search").addEventListener("input", renderShop);
$("sort").addEventListener("change", renderShop);
$("trackerButton").addEventListener("click", openTracker);

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => mode(tab.dataset.mode));
});

$("year").textContent = new Date().getFullYear();

loadMap();
loadShop();

// Nur aktualisieren, solange die Seite sichtbar ist.
setInterval(() => {
  if (document.visibilityState === "visible") {
    if (currentMode === "br") loadMap();
    loadShop();
  }
}, 30 * 60 * 1000);
