"use strict";

const API_URL = "https://fortnite-api.com/v2/shop?language=de";
const API_KEY = "613bf376-b744-4781-917f-707018a83c9a";

const shopGrid = document.getElementById("shopGrid");
const searchInput = document.getElementById("search-input");
const shopStatus = document.getElementById("shop-status");
const shopCount = document.getElementById("shop-count");
const emptyState = document.getElementById("empty-state");
const refreshButton = document.getElementById("refreshShop");

let allItems = [];
let currentRequest = 0;

function setStatus(message, online = false) {
  if (!shopStatus) return;

  const dot = document.createElement("span");
  dot.className = "status-dot";

  if (!online) {
    dot.style.background = "#a100ff";
  }

  shopStatus.replaceChildren(
    dot,
    document.createTextNode(message)
  );
}

function getShopEntries(response) {
  const data = response?.data;

  // Ältere/alternative Antworten liefern die Items direkt als Array.
  if (Array.isArray(data)) return data;

  // Manche Shop-Antworten liefern eine einzelne entries-Liste.
  if (Array.isArray(data?.entries)) return data.entries;

  // Fortnite-API kann den Shop nach Bereichen aufteilen
  // (z. B. featured, daily, specialFeatured).
  if (data && typeof data === "object") {
    const sections = Object.values(data);
    const entries = sections.flatMap(section =>
      Array.isArray(section?.entries) ? section.entries : []
    );

    if (entries.length) return entries;
  }

  return [];
}

function getItemName(item) {
  return (
    item?.bundle?.name ||
    item?.items?.br?.[0]?.name ||
    item?.tracks?.[0]?.title ||
    item?.instruments?.[0]?.name ||
    item?.cars?.[0]?.name ||
    item?.name ||
    item?.title ||
    "Unbekanntes Item"
  );
}

function getItemImage(item) {
  const candidates = [
    item?.newDisplayAsset?.renderImages?.[0]?.image,
    item?.newDisplayAsset?.materialInstances?.[0]?.images?.OfferImage,
    item?.items?.br?.[0]?.images?.featured,
    item?.items?.br?.[0]?.images?.icon,
    item?.items?.br?.[0]?.images?.icon,
    item?.tracks?.[0]?.albumArt,
    item?.instruments?.[0]?.images?.large,
    item?.cars?.[0]?.images?.icon,
    item?.bundle?.image,
    item?.images?.icon,
    item?.items?.br?.[0]?.images?.icon
  ];

  return candidates.find(value =>
    typeof value === "string" &&
    /^https:\/\//i.test(value)
  ) || "";
}

function getItemPrice(item) {
  const candidates = [
    item?.finalPrice,
    item?.regularPrice,
    item?.items?.br?.[0]?.price,
    item?.tracks?.[0]?.price
  ];

  for (const value of candidates) {
    if (value !== null && value !== undefined && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }

  return 0;
}

function getItemType(item) {
  return (
    item?.layout?.name ||
    item?.items?.br?.[0]?.type?.name || item?.items?.br?.[0]?.type?.displayValue ||
    item?.tracks?.[0]?.type ||
    item?.instruments?.[0]?.type?.displayValue ||
    item?.cars?.[0]?.type?.displayValue ||
    item?.bundle?.name ||
    "Fortnite Item"
  );
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function createItemCard(item) {
  const card = createElement("article", "item-card");
  const imageUrl = getItemImage(item);

  if (imageUrl) {
    const image = createElement("img");
    image.src = imageUrl;
    image.alt = getItemName(item);
    image.loading = "lazy";
    image.decoding = "async";

    image.addEventListener("error", () => {
      image.remove();
    }, { once: true });

    card.appendChild(image);
  }

  const content = createElement("div", "item-card-content");
  const rarity = createElement("div", "item-rarity", getItemType(item));
  const name = createElement("h3", "", getItemName(item));
  const description = createElement("p", "", "FORTNITE ITEM");

  const price = createElement("div", "item-price");
  const priceLabel = createElement("span", "", "V-BUCKS");
  const priceValue = createElement("strong");

  const amount = getItemPrice(item);

  priceValue.textContent = amount > 0
    ? amount.toLocaleString("de-DE")
    : "—";

  price.append(priceLabel, priceValue);
  content.append(rarity, name, description, price);
  card.appendChild(content);

  return card;
}

function renderItems(items) {
  if (!shopGrid) return;

  shopGrid.replaceChildren();

  if (shopCount) {
    const count = createElement("span", "", String(items.length));

    shopCount.replaceChildren(
      document.createTextNode("ITEMS "),
      count
    );
  }

  if (items.length === 0) {
    const message = createElement("p", "loading-panel", "Keine Shop-Artikel gefunden.");
    shopGrid.appendChild(message);
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const item of items) {
    fragment.appendChild(createItemCard(item));
  }

  shopGrid.appendChild(fragment);
}

function filterItems() {
  const query = (searchInput?.value || "")
    .trim()
    .toLocaleLowerCase("de");

  const filtered = allItems.filter(item => {
    const name = getItemName(item).toLocaleLowerCase("de");
    const type = getItemType(item).toLocaleLowerCase("de");

    return name.includes(query) || type.includes(query);
  });

  renderItems(filtered);
}

function showLoading() {
  if (!shopGrid) return;

  const panel = createElement("div", "loading-panel");
  const ring = createElement("div", "loading-ring");
  const title = createElement("p", "", "LOOT WIRD GELADEN");
  const subtitle = createElement("span", "", "BITTE WARTEN...");

  panel.append(ring, title, subtitle);
  shopGrid.replaceChildren(panel);

  if (emptyState) {
    emptyState.hidden = true;
  }
}

function showError(message) {
  if (!shopGrid) return;

  const panel = createElement("div", "loading-panel");
  const title = createElement("p", "", "VERBINDUNG FEHLGESCHLAGEN");
  const description = createElement("span", "", message);

  panel.append(title, description);
  shopGrid.replaceChildren(panel);

  if (shopCount) {
    shopCount.textContent = "ITEMS —";
  }
}

async function loadShop() {
  if (!shopGrid) return;

  const requestId = ++currentRequest;

  if (refreshButton) {
    refreshButton.disabled = true;
    refreshButton.style.opacity = "0.65";
  }

  showLoading();
  setStatus("VERBINDE MIT DER ZONE...");

  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `ApiKey ${API_KEY}`
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`API-Fehler: HTTP ${response.status}`);
    }

    const result = await response.json();
    const entries = getShopEntries(result);

    if (requestId !== currentRequest) return;

    if (!entries.length) {
      throw new Error("Die API hat keine Shop-Items zurückgegeben.");
    }

    allItems = entries;
    filterItems();

    setStatus("ZONE ONLINE // SHOP ERFOLGREICH GELADEN", true);
  } catch (error) {
    if (requestId !== currentRequest) return;

    console.error("Dropzone Shop Fehler:", error);

    showError(
      "Der Shop konnte nicht geladen werden. Prüfe API-Key und Verbindung."
    );

    setStatus("ZONE OFFLINE // API-FEHLER");
  } finally {
    if (requestId === currentRequest && refreshButton) {
      refreshButton.disabled = false;
      refreshButton.style.opacity = "1";
    }
  }
}

if (searchInput) {
  searchInput.addEventListener("input", filterItems);
}

if (refreshButton) {
  refreshButton.addEventListener("click", loadShop);
}

loadShop();
