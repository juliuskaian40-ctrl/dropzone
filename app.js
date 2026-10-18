
/* =========================================
   DROPZONE - MAPS & FORTNITE INTEL
   Append to the END of app.js
   ========================================= */

(() => {
  "use strict";

  const DZ_API = "https://fortnite-api.com";

  /*
   * Optional:
   * Add a direct image URL for a Reload map you are
   * permitted to use. Leave empty until you have one.
   *
   * Do not put a private API key in this public file.
   */
  const RELOAD_MAP_IMAGE_URL = "";

  const $ = (id) => document.getElementById(id);

  async function dzFetch(path) {
    const response = await fetch(`${DZ_API}${path}`, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`API request failed: HTTP ${response.status}`);
    }

    const json = await response.json();

    if (json?.status && json.status !== 200) {
      throw new Error(json.error || "Fortnite API error");
    }

    return json?.data ?? json;
  }

  function dzSetStatus(id, message, isError = false) {
    const element = $(id);
    if (!element) return;

    element.textContent = message;
    element.classList.toggle("dz-data-error", isError);
  }

  function dzSafeImageUrl(value) {
    if (typeof value !== "string") return "";

    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  function dzShowMapImage(imageId, statusId, url, message) {
    const image = $(imageId);
    const status = $(statusId);

    if (!image || !status) return;

    const safeUrl = dzSafeImageUrl(url);

    if (!safeUrl) {
      image.hidden = true;
      image.removeAttribute("src");
      dzSetStatus(statusId, message);
      return;
    }

    image.hidden = true;
    image.onload = () => {
      image.hidden = false;
      status.hidden = true;
    };

    image.onerror = () => {
      image.hidden = true;
      image.removeAttribute("src");
      status.hidden = false;
      dzSetStatus(statusId, "Das Kartenbild konnte nicht geladen werden.", true);
    };

    status.hidden = false;
    dzSetStatus(statusId, "Kartenbild wird geladen ...");
    image.src = safeUrl;
  }

  async function dzLoadBattleRoyaleMap() {
    try {
      const map = await dzFetch("/v1/map?language=de");

      /*
       * The API's map response may contain a blank map image
       * and POI-specific images. Prefer the blank map for the
       * full map view, then try the other documented image fields.
       */
      const images = map?.images ?? {};
      const mapImage =
        images.blank ||
        images.pois ||
        images.spoiler ||
        images;

      const imageUrl =
        typeof mapImage === "string"
          ? mapImage
          : "";

      if (!imageUrl) {
        console.warn("DROPZONE: Map response:", map);

        dzSetStatus(
          "brMapStatus",
          "Die API hat kein verwendbares Kartenbild geliefert. Bitte Konsole prüfen.",
          true
        );
      } else {
        dzShowMapImage(
          "brMapImage",
          "brMapStatus",
          imageUrl,
          "Kein Kartenbild verfügbar."
        );

        const openLink = $("brMapOpen");
        if (openLink) openLink.href = imageUrl;
      }

      const pois = Array.isArray(map?.pois) ? map.pois : [];
      const list = $("brPoiList");

      if (list) {
        list.replaceChildren();

        pois.slice(0, 24).forEach((poi) => {
          const name =
            poi?.name ||
            poi?.location ||
            poi?.id;

          if (!name || typeof name !== "string") return;

          const chip = document.createElement("span");
          chip.className = "dz-poi-chip";
          chip.textContent = name;
          list.append(chip);
        });
      }

      const info = $("brMapInfo");
      if (info) {
        info.textContent = pois.length
          ? `${pois.length} POIs in der API-Antwort`
          : "Aktuelle Karte";
      }
    } catch (error) {
      console.error("DROPZONE Battle Royale map:", error);

      dzSetStatus(
        "brMapStatus",
        "Battle-Royale-Karte konnte nicht geladen werden. API-Verbindung prüfen.",
        true
      );
    }
  }

  function dzLoadReloadMap() {
    if (RELOAD_MAP_IMAGE_URL) {
      dzShowMapImage(
        "reloadMapImage",
        "reloadMapStatus",
        RELOAD_MAP_IMAGE_URL,
        "Reload-Kartenbild nicht verfügbar."
      );
      return;
    }

    dzShowMapImage(
      "reloadMapImage",
      "reloadMapStatus",
      "",
      "Noch keine Reload-Kartenbild-URL hinterlegt. Trage oben eine gültige Bild-URL ein."
    );
  }

  async function dzLoadPlaylists() {
    const list = $("dzPlaylists");
    if (!list) return;

    list.textContent = "Playlists werden geladen ...";

    try {
      const data = await dzFetch("/v1/playlists?language=de");
      const playlists = Array.isArray(data)
        ? data
        : Array.isArray(data?.playlists)
          ? data.playlists
          : [];

      list.replaceChildren();

      const relevant = playlists
        .filter((item) => item && (item.name || item.id))
        .slice(0, 12);

      if (!relevant.length) {
        list.textContent = "Keine Playlists in der Antwort gefunden.";
        return;
      }

      relevant.forEach((playlist, index) => {
        const row = document.createElement("div");
        row.className = "dz-data-row";

        const number = document.createElement("span");
        number.className = "dz-data-index";
        number.textContent = String(index + 1).padStart(2, "0");

        const name = document.createElement("span");
        name.textContent = playlist.name || playlist.id;

        row.append(number, name);
        list.append(row);
      });
    } catch (error) {
      console.error("DROPZONE playlists:", error);
      list.replaceChildren();

      const message = document.createElement("p");
      message.className = "dz-data-error";
      message.textContent = "Playlists konnten nicht geladen werden.";
      list.append(message);
    }
  }

  async function dzLoadNewCosmetics() {
    const list = $("dzNewCosmetics");
    if (!list) return;

    list.textContent = "Cosmetics werden geladen ...";

    try {
      const data = await dzFetch("/v2/cosmetics/new?language=de");

      const cosmetics = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : [];

      list.replaceChildren();

      const relevant = cosmetics
        .filter((item) => item && (item.name || item.id))
        .slice(0, 10);

      if (!relevant.length) {
        list.textContent = "Keine neuen Cosmetics gefunden.";
        return;
      }

      relevant.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "dz-data-row";

        const number = document.createElement("span");
        number.className = "dz-data-index";
        number.textContent = String(index + 1).padStart(2, "0");

        const name = document.createElement("span");
        name.textContent = item.name || item.id;

        row.append(number, name);
        list.append(row);
      });
    } catch (error) {
      console.error("DROPZONE new cosmetics:", error);
      list.replaceChildren();

      const message = document.createElement("p");
      message.className = "dz-data-error";
      message.textContent = "Neue Cosmetics konnten nicht geladen werden.";
      list.append(message);
    }
  }

  async function dzRefreshMaps() {
    const button = $("refreshMaps");

    if (button) button.disabled = true;

    try {
      await Promise.allSettled([
        dzLoadBattleRoyaleMap(),
        dzLoadPlaylists(),
        dzLoadNewCosmetics()
      ]);
    } finally {
      if (button) button.disabled = false;
    }
  }

  function dzInit() {
    const refreshButton = $("refreshMaps");

    if (refreshButton) {
      refreshButton.addEventListener("click", dzRefreshMaps);
    }

    dzLoadReloadMap();
    dzRefreshMaps();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", dzInit, { once: true });
  } else {
    dzInit();
  }
})();
