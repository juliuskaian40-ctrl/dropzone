
/* DROPZONE - Fortnite API additions */

(() => {
  const API = "https://fortnite-api.com";

  async function getData(endpoint) {
    const response = await fetch(`${API}${endpoint}`);

    if (!response.ok) {
      throw new Error(`API error ${response.status}`);
    }

    const json = await response.json();
    return json.data;
  }

  async function loadBattleRoyaleMap() {
    const status = document.getElementById("brMapStatus");
    const image = document.getElementById("brMapImage");

    try {
      const map = await getData("/v1/map?language=en");
      const url = map?.images?.blank;

      if (!url) throw new Error("Map image not available");

      image.onload = () => {
        image.hidden = false;
        status.hidden = true;
      };

      image.onerror = () => {
        status.hidden = false;
        status.textContent = "Map image could not be loaded.";
      };

      image.src = url;
    } catch (error) {
      console.error("DROPZONE map:", error);
      status.textContent = "Map unavailable. Please try again later.";
    }
  }

  async function loadPlaylists() {
    const container = document.getElementById("dzPlaylists");

    try {
      const data = await getData("/v1/playlists?language=en");
      container.replaceChildren();

      (Array.isArray(data) ? data : []).slice(0, 12).forEach(item => {
        const row = document.createElement("div");
        row.className = "dz-data-row";
        row.textContent = item.name || item.id || "Game mode";
        container.appendChild(row);
      });
    } catch (error) {
      container.textContent = "Playlists unavailable.";
      console.error(error);
    }
  }

  async function loadNews() {
    const container = document.getElementById("dzNews");
    if (!container) return;

    try {
      const data = await getData("/v2/news");

      container.replaceChildren();

      const news = data?.br?.motds || [];

      news.slice(0, 5).forEach(item => {
        const row = document.createElement("div");
        row.className = "dz-data-row";
        row.textContent = item.title || "Fortnite News";
        container.appendChild(row);
      });
    } catch (error) {
      container.textContent = "News unavailable.";
      console.error(error);
    }
  }

  function init() {
    document.getElementById("refreshMaps")
      ?.addEventListener("click", () => {
        loadBattleRoyaleMap();
        loadPlaylists();
        loadNews();
      });

    loadBattleRoyaleMap();
    loadPlaylists();
    loadNews();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
