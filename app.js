
"use strict";

const API = "https://fortnite-api.com";
const RELOAD_MAP_IMAGE_URL = ""; // Hier später eine echte Reload-Kartenbild-URL einsetzen.

const $ = (id) => document.getElementById(id);

async function apiGet(endpoint) {
  const response = await fetch(`${API}${endpoint}`);

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  const json = await response.json();
  if (json.status && json.status !== 200) {
    throw new Error(json.error || "Fortnite API error");
  }
  return json.data;
}

function showMessage(id, message) {
  const el = $(id);
  if (el) {
    el.hidden = false;
    el.textContent = message;
  }
}

function imageUrl(value) {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function renderImage(img, placeholder, url) {
  if (!img || !placeholder) return;

  const safe = imageUrl(url);
  if (!safe) {
    img.hidden = true;
    placeholder.hidden = false;
    placeholder.textContent = "Kein Kartenbild verfügbar.";
    return;
  }

  img.onload = () => {
    img.hidden = false;
    placeholder.hidden = true;
  };

  img.onerror = () => {
    img.hidden = true;
    placeholder.hidden = false;
    placeholder.textContent = "Bild konnte nicht geladen werden.";
  };

  placeholder.hidden = false;
  placeholder.textContent = "Bild wird geladen...";
  img.src = safe;
}

async function loadMap() {
  try {
    const data = await apiGet("/v1/map?language=en");
    const image = data?.images?.blank;

    renderImage($("brMap"), $("brMapStatus"), image);

    if (image && $("openBrMap")) {
      $("openBrMap").href = image;
    }

    if ($("brMapVersion")) {
      $("brMapVersion").textContent = data?.season
        ? `SEASON ${data.season}`
        : "CURRENT MAP";
    }

    const list = $("poiList");
    if (list) {
      list.replaceChildren();

      (Array.isArray(data?.pois) ? data.pois : [])
        .slice(0, 30)
        .forEach((poi) => {
          const name = poi?.name || poi?.location;
          if (!name) return;

          const chip = document.createElement("span");
          chip.className = "poi-chip";
          chip.textContent = name;
          list.append(chip);
        });
    }
  } catch (error) {
    console.error("Map error:", error);
    showMessage("brMapStatus", "Map konnte nicht geladen werden. Bitte später erneut versuchen.");
  }
}

function loadReloadMap() {
  renderImage(
    $("reloadMap"),
    $("reloadStatus"),
    RELOAD_MAP_IMAGE_URL
  );
}

async function loadPlaylists() {
  const grid = $("modeGrid");
  if (!grid) return;

  try {
    const data = await apiGet("/v1/playlists?language=en");
    grid.replaceChildren();

    (Array.isArray(data) ? data : [])
      .filter((item) => item && (item.name || item.id))
      .slice(0, 30)
      .forEach((item) => {
        const card = document.createElement("article");
        card.className = "mode-card";

        const title = document.createElement("h3");
        title.textContent = item.name || item.id;

        const description = document.createElement("p");
        description.textContent = item.description || item.id || "Fortnite playlist";

        card.append(title, description);
        grid.append(card);
      });

    if (!grid.children.length) {
      grid.textContent = "Keine Playlists zurückgegeben.";
    }
  } catch (error) {
    console.error("Playlist error:", error);
    grid.textContent = "Playlists konnten nicht geladen werden.";
  }
}

async function loadShop() {
  const grid = $("shopGrid");
  if (!grid) return;

  try {
    const data = await apiGet("/v2/shop?language=en");
    const entries = data?.entries || data?.shop || [];

    grid.replaceChildren();

    entries.slice(0, 24).forEach((entry) => {
      const item = entry?.brItems?.[0] || entry?.items?.[0] || entry;
      const name = item?.name || entry?.devName || "Fortnite item";
      const price = entry?.finalPrice ?? entry?.regularPrice;
      const image = item?.images?.featured || item?.images?.icon || item?.images?.smallIcon;

      const card = document.createElement("article");
      card.className = "item-card";

      if (imageUrl(image)) {
        const img = document.createElement("img");
        img.src = imageUrl(image);
        img.alt = name;
        img.loading = "lazy";
        card.append(img);
      }

      const info = document.createElement("div");
      info.className = "item-info";

      const title = document.createElement("h3");
      title.textContent = name;

      const type = document.createElement("p");
      type.textContent = item?.type?.displayValue || item?.type?.value || "Item Shop";

      const cost = document.createElement("p");
      cost.className = "price";
      cost.textContent = price != null ? `${price} V-Bucks` : "Shop item";

      info.append(title, type, cost);
      card.append(info);
      grid.append(card);
    });

    if (!grid.children.length) {
      grid.textContent = "Shop-Daten haben ein anderes Format oder sind gerade nicht verfügbar.";
    }

    if ($("shopUpdated")) {
      $("shopUpdated").textContent = data?.date
        ? `Updated ${new Date(data.date).toLocaleString()}`
        : "Shop data loaded";
    }
  } catch (error) {
    console.error("Shop error:", error);
    grid.textContent = "Item Shop konnte nicht geladen werden.";
  }
}

async function loadCosmetics() {
  const grid = $("cosmeticGrid");
  if (!grid) return;

  try {
    const data = await apiGet("/v2/cosmetics/new?language=en");
    const items = Array.isArray(data) ? data : (data?.items || []);

    grid.replaceChildren();

    items.slice(0, 16).forEach((item) => {
      const name = item?.name || item?.id || "Cosmetic";
      const image = item?.images?.icon || item?.images?.smallIcon;

      const card = document.createElement("article");
      card.className = "item-card";

      if (imageUrl(image)) {
        const img = document.createElement("img");
        img.src = imageUrl(image);
        img.alt = name;
        img.loading = "lazy";
        card.append(img);
      }

      const info = document.createElement("div");
      info.className = "item-info";

      const title = document.createElement("h3");
      title.textContent = name;

      const rarity = document.createElement("p");
      rarity.textContent = item?.rarity?.displayValue || "New cosmetic";

      info.append(title, rarity);
      card.append(info);
      grid.append(card);
    });

    if (!grid.children.length) {
      grid.textContent = "Keine neuen Cosmetics verfügbar.";
    }
  } catch (error) {
    console.error("Cosmetics error:", error);
    grid.textContent = "Cosmetics konnten nicht geladen werden.";
  }
}

async function loadNews() {
  const grid = $("newsGrid");
  if (!grid) return;

  try {
    const data = await apiGet("/v2/news");
    const news = data?.br?.motds || [];

    grid.replaceChildren();

    news.slice(0, 10).forEach((item) => {
      const card = document.createElement("article");
      card.className = "news-card";

      const image = imageUrl(item?.image);
      if (image) {
        const img = document.createElement("img");
        img.src = image;
        img.alt = item?.title || "Fortnite news";
        img.loading = "lazy";
        card.append(img);
      }

      const title = document.createElement("h3");
      title.textContent = item?.title || "Fortnite News";

      const body = document.createElement("p");
      body.textContent = item?.body || item?.tabTitle || "Latest Fortnite update";

      card.append(title, body);
      grid.append(card);
    });

    if (!grid.children.length) {
      grid.textContent = "Keine News zurückgegeben.";
    }
  } catch (error) {
    console.error("News error:", error);
    grid.textContent = "News konnten nicht geladen werden.";
  }
}

async function refreshAll() {
  const button = $("refreshBtn");
  if (button) button.disabled = true;

  try {
    await Promise.allSettled([
      loadMap(),
      loadPlaylists(),
      loadShop(),
      loadCosmetics(),
      loadNews()
    ]);
  } finally {
    if (button) button.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadReloadMap();
  $("refreshBtn")?.addEventListener("click", refreshAll);
  refreshAll();
});

