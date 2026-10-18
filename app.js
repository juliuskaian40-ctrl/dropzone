const translations = {
  de: {
    navHome: "Startseite", navMap: "Battle Royale Map", navShop: "Item-Shop",
    languageLabel: "Sprache", heroEyebrow: "DEIN FORTNITE HUB", heroLine1: "DROP IN.",
    heroLine2: "GEAR UP.", heroText: "Dein Hub für den Fortnite-Shop und die Battle-Royale-Karte.",
    heroShop: "Shop ansehen", heroMap: "Karte öffnen ↗", shopEyebrow: "TÄGLICH NEU",
    shopTitle: "FORTNITE ITEM-SHOP.", refresh: "Aktualisieren", shopLoading: "Shop wird geladen …",
    shopNote: "Die Verfügbarkeit hängt von der API ab. Dropzone ist ein Fan-Projekt und nicht mit Epic Games verbunden.",
    mapEyebrow: "PLAN YOUR DROP", mapTitle: "DIE INSEL WARTET.", mapText: "Öffne die separate Karte und wähle aus, welche Karteninformationen du sehen möchtest.",
    mapButton: "Battle Royale Map öffnen ↗", footerNote: "Fan-Projekt — nicht mit Epic Games verbunden.",
    shopError: "Der Shop konnte nicht geladen werden. Bitte später erneut versuchen.",
    noItems: "Die API hat aktuell keine Shop-Artikel zurückgegeben."
  },
  en: {
    navHome: "Home", navMap: "Battle Royale Map", navShop: "Item Shop",
    languageLabel: "Language", heroEyebrow: "YOUR FORTNITE HUB", heroLine1: "DROP IN.",
    heroLine2: "GEAR UP.", heroText: "Your hub for the Fortnite shop and Battle Royale map.",
    heroShop: "View shop", heroMap: "Open map ↗", shopEyebrow: "DAILY UPDATE",
    shopTitle: "FORTNITE ITEM SHOP.", refresh: "Refresh", shopLoading: "Loading shop …",
    shopNote: "Availability depends on the API. Dropzone is a fan project and is not affiliated with Epic Games.",
    mapEyebrow: "PLAN YOUR DROP", mapTitle: "THE ISLAND AWAITS.", mapText: "Open the separate map and choose which map information to display.",
    mapButton: "Open Battle Royale Map ↗", footerNote: "Fan project — not affiliated with Epic Games.",
    shopError: "Could not load the shop. Please try again later.",
    noItems: "The API did not return any shop items right now."
  }
};

const SHOP_URL = `/api/shop?language=${encodeURIComponent(getLanguage())}`;

function getLanguage() {
  return localStorage.getItem("dropzone-language") || "de";
}

function applyLanguage(language) {
  const safeLanguage = translations[language] ? language : "de";
  localStorage.setItem("dropzone-language", safeLanguage);
  document.documentElement.lang = safeLanguage;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (translations[safeLanguage][key]) {
      element.textContent = translations[safeLanguage][key];
    }
  });

  const select = document.getElementById("languageSelect");
  if (select) select.value = safeLanguage;

  const status = document.getElementById("shopStatus");
  if (status && status.dataset.state === "loading") {
    status.textContent = translations[safeLanguage].shopLoading;
  }
}

async function loadShop() {
  const status = document.getElementById("shopStatus");
  const grid = document.getElementById("shopGrid");
  if (!status || !grid) return;

  status.dataset.state = "loading";
  status.textContent = translations[getLanguage()].shopLoading;
  grid.replaceChildren();

  try {
    // The API key is kept server-side in the Cloudflare Pages Function.
    // Never place a private API key in this public frontend file.
    const response = await fetch(SHOP_URL, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Shop API returned ${response.status}`);

    const json = await response.json();
    const entries = json?.data?.entries || [];
    if (!entries.length) {
      status.textContent = translations[getLanguage()].noItems;
      status.dataset.state = "done";
      return;
    }

    const items = entries.flatMap(entry => entry.items || []).slice(0, 36);
    items.forEach(item => {
      const card = document.createElement("article");
      card.className = "shop-card";

      const image = document.createElement("img");
      image.loading = "lazy";
      image.alt = item.name || "Fortnite item";
      image.src = item.images?.icon || item.images?.featured || item.images?.smallIcon || "";
      image.onerror = () => { image.style.visibility = "hidden"; };

      const body = document.createElement("div");
      body.className = "shop-card-body";

      const title = document.createElement("h3");
      title.textContent = item.name || "Fortnite Item";

      const price = document.createElement("p");
      const amount = entry.finalPrice ?? entry.regularPrice;
      price.textContent = amount != null ? `${amount} V-Bucks` : (item.type?.displayValue || "Fortnite");

      body.append(title, price);
      card.append(image, body);
      grid.append(card);
    });

    status.textContent = "";
    status.dataset.state = "done";
  } catch (error) {
    console.error("Shop loading failed:", error);
    status.textContent = translations[getLanguage()].shopError;
    status.dataset.state = "error";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const languageSelect = document.getElementById("languageSelect");
  if (languageSelect) {
    languageSelect.value = getLanguage();
    languageSelect.addEventListener("change", () => applyLanguage(languageSelect.value));
  }

  const refresh = document.getElementById("refreshShop");
  if (refresh) refresh.addEventListener("click", loadShop);

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  applyLanguage(getLanguage());
  loadShop();
});
