const mapTranslations = {
  de: {
    navHome: "Startseite", navMap: "Battle Royale Map", navShop: "Item-Shop",
    mapHeading: "BATTLE ROYALE MAP.", mapIntro: "Erkunde die Fortnite-Karte und passe die angezeigten Informationen an.",
    showLocations: "Ortsnamen anzeigen", showChests: "Truhen anzeigen", showLoot: "Loot anzeigen",
    showBosses: "Bosse/NPCs anzeigen", reloadMap: "Karte neu laden",
    mapDisclaimer: "Hinweis: Die API liefert das Kartenbild und Ortsnamen. Exakte Truhen-, Loot- und NPC-Spawnpositionen sind in dieser Datenquelle nicht enthalten. Diese Schalter zeigen deshalb einen Hinweis, statt erfundene Positionen anzuzeigen.",
    openMap: "Kartenbild separat öffnen ↗", footerNote: "Fan-Projekt — nicht mit Epic Games verbunden.",
    loading: "Karte wird geladen …", error: "Die Karte konnte nicht geladen werden. Bitte später erneut versuchen.",
    noPlaces: "Keine Orte wurden von der API zurückgegeben.",
    filtersUnavailable: "Ausgewählte Filter: {filters}. Diese Datenquelle stellt keine genauen Spawnpositionen bereit; es werden keine Marker erfunden."
  },
  en: {
    navHome: "Home", navMap: "Battle Royale Map", navShop: "Item Shop",
    mapHeading: "BATTLE ROYALE MAP.", mapIntro: "Explore the Fortnite map and customize the information displayed.",
    showLocations: "Show location names", showChests: "Show chests", showLoot: "Show loot",
    showBosses: "Show bosses/NPCs", reloadMap: "Reload map",
    mapDisclaimer: "Note: The API provides the map image and location names. Exact chest, loot and NPC spawn locations are not included in this data source. These toggles therefore show a notice instead of fabricated positions.",
    openMap: "Open map image separately ↗", footerNote: "Fan project — not affiliated with Epic Games.",
    loading: "Loading map …", error: "Could not load the map. Please try again later.",
    noPlaces: "The API did not return any locations.",
    filtersUnavailable: "Selected filters: {filters}. This data source does not provide exact spawn positions, so no markers are fabricated."
  }
};

let mapData = null;
let mapBlankUrl = "";
let mapNamedUrl = "";

function language() {
  return localStorage.getItem("dropzone-language") || "de";
}

function translateMap(lang) {
  const dictionary = mapTranslations[lang] || mapTranslations.de;
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(element => {
    const key = element.dataset.i18n;
    if (dictionary[key]) element.textContent = dictionary[key];
  });
  const select = document.getElementById("languageSelect");
  if (select) select.value = lang;
  document.getElementById("year").textContent = new Date().getFullYear();
  updateMapFilters();
}

function renderMap() {
  const image = document.getElementById("battleMap");
  const status = document.getElementById("mapStatus");
  const showNames = document.getElementById("showLocations").checked;

  const url = showNames && mapNamedUrl ? mapNamedUrl : mapBlankUrl;
  if (!url) return;

  image.onload = () => {
    image.hidden = false;
    status.hidden = true;
  };
  image.onerror = () => {
    image.hidden = false;
    status.hidden = false;
    status.classList.add("error");
    status.textContent = mapTranslations[language()].error;
  };
  image.src = url;
  document.getElementById("openOriginalMap").href = url;
}

function updateMapFilters() {
  const selected = [];
  if (document.getElementById("showChests").checked) selected.push(language() === "de" ? "Truhen" : "chests");
  if (document.getElementById("showLoot").checked) selected.push("loot");
  if (document.getElementById("showBosses").checked) selected.push(language() === "de" ? "Bosse/NPCs" : "bosses/NPCs");
  const status = document.getElementById("filterStatus");

  if (!selected.length) {
    status.textContent = "";
    return;
  }
  status.textContent = mapTranslations[language()].filtersUnavailable.replace("{filters}", selected.join(", "));
}

async function loadMap() {
  const status = document.getElementById("mapStatus");
  status.hidden = false;
  status.classList.remove("error");
  status.textContent = mapTranslations[language()].loading;

  try {
    // The public map endpoint usually works without a key. If your API provider
    // requires one, don't put a private key in a public GitHub Pages frontend.
    const response = await fetch("https://fortnite-api.com/v1/map?language=" + language());
    if (!response.ok) throw new Error(`Map API returned ${response.status}`);

    const json = await response.json();
    mapData = json.data;
    mapBlankUrl = mapData?.images?.blank || "";
    mapNamedUrl = mapData?.images?.pois || "";

    if (!mapBlankUrl && !mapNamedUrl) throw new Error("No map images returned");

    const places = document.getElementById("mapPlaces");
    places.replaceChildren();
    const pois = Array.isArray(mapData?.pois) ? mapData.pois : [];

    pois.forEach(poi => {
      if (!poi?.name) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "map-place";
      button.textContent = poi.name;
      button.addEventListener("click", () => {
        document.getElementById("showLocations").checked = true;
        renderMap();
      });
      places.append(button);
    });

    if (!pois.length) {
      const message = document.createElement("span");
      message.className = "map-note";
      message.textContent = mapTranslations[language()].noPlaces;
      places.append(message);
    }

    renderMap();
    updateMapFilters();
  } catch (error) {
    console.error("Map loading failed:", error);
    status.hidden = false;
    status.classList.add("error");
    status.textContent = mapTranslations[language()].error;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("languageSelect");
  select.value = language();
  translateMap(select.value);
  select.addEventListener("change", () => {
    localStorage.setItem("dropzone-language", select.value);
    translateMap(select.value);
    loadMap();
  });

  ["showLocations", "showChests", "showLoot", "showBosses"].forEach(id => {
    document.getElementById(id).addEventListener("change", () => {
      if (id === "showLocations") renderMap();
      updateMapFilters();
    });
  });
  document.getElementById("reloadMap").addEventListener("click", loadMap);
  loadMap();
});
