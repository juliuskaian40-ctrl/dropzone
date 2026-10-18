
"use strict";

const API_URL = "https://fortnite-api.com/v2/shop?language=de";
const API_KEY = "613bf376-b744-4781-917f-707018a83c9a";

const shopGrid = document.getElementById("shop-grid");
const searchInput = document.getElementById("search-input");
const shopStatus = document.getElementById("shop-status");
const shopCount = document.getElementById("shop-count");
const emptyState = document.getElementById("empty-state");
const refreshButton = document.getElementById("refresh-button");

let allItems = [];

function setStatus(message, online = false) {
  if (!shopStatus) return;

  shopStatus.replaceChildren();

  const dot = document.createElement("span");
  dot.className = "status-dot";

  if (!online) {
    dot.style.background = "#a100ff";
  }

  shopStatus.append(dot, document.createTextNode(message));
}

function getShopEntries(data) {
  const entries = data?.data?.entries;
  return Array.isArray(entries) ? entries : [];
}

function getItemName(item) {
  return item?.name
    || item?.title
    || item?.brItems?.[0]?.name
    || item?.tracks?.[0]?.title
    || "Unbekanntes Item";
}

function getItemImage(item) {
  const candidates = [
    item?.newDisplayAsset?.renderImages?.[0]?.image,
    item?.newDisplayAsset?.materialInstances?.[0]?.images?.OfferImage,
    item?.brItems?.[0]?.images?.featured,
    item?.brItems?.[0]?.images?.icon,
    item?.tracks?.[0]?.albumArt,
    item?.images?.icon
  ];

  return candidates.find(value =>
    typeof value === "string" && value.startsWith("https://")
  ) || "";
}

function getItemPrice(item) {
  const price =
    item?.finalPrice ??
    item?.regularPrice ??
    item?.brItems?.[0]?.price ??
    0;

  return Number.isFinite(Number(price)) ? Number(price) : 0;
}

function getItemType(item) {
  return item?.layout?.name
    || item?.brItems?.[0]?.type?.displayValue
    || item?.tracks?.[0]?.type
    || item?.bundle?.name
    || "Fortnite Item";
}

function createItemCard(item) {
  const card = document.createElement("article");
  card.className = "item-card";

  const imageUrl = getItemImage(item);
  if (imageUrl) {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = getItemName(item);
    image.loading = "lazy";
    image.decoding = "async";

    image.addEventListener("error", () => {
      image.style.display = "none";
    });

    card.appendChild(image);
  }

  const content = document.createElement("div");
  content.className = "item-card-content";

  const rarity = document.createElement("div");
  rarity.className = "item-rarity";
  rarity.textContent = getItemType(item);

  const name = document.createElement("h3");
  name.textContent = getItemName(item);

  const description = document.createElement("p");
  description.textContent = "FORTNITE ITEM";

  const price = document.createElement("div");
  price.className = "item-price";

  const priceLabel = document.createElement("span");
  priceLabel.textContent = "V-BUCKS";

  const priceValue = document.createElement("strong");
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
    const count = document.createElement("span");
    count.textContent = String(items.length);
    shopCount.replaceChildren(
      document.createTextNode("ITEMS "),
      count
    );
  }

  if (emptyState) {
    emptyState.hidden = items.length !== 0;
  }

  if (items.length === 0) {
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const item of items) {
    fragment.appendChild(createItemCard(item));
  }

  shopGrid.appendChild(fragment);
}

function filterItems() {
  const query = (searchInput?.value || "").trim().toLocaleLowerCase("de");

  const filtered = allItems.filter(item => {
    const name = getItemName(item).toLocaleLowerCase("de");
    const type = getItemType(item).toLocaleLowerCase("de");

    return name.includes(query) || type.includes(query);
  });

  renderItems(filtered);
}

async function loadShop() {
  if (!shopGrid) return;

  if (refreshButton) {
    refreshButton.disabled = true;
    refreshButton.style.opacity = "0.65";
  }

  shopGrid.replaceChildren();

  const loading = document.createElement("div");
  loading.className = "loading-panel";

  const ring = document.createElement("div");
  ring.className = "loading-ring";

  const title = document.createElement("p");
  title.textContent = "LOOT WIRD GELADEN";

  const subtitle = document.createElement("span");
  subtitle.textContent = "BITTE WARTEN...";

  loading.append(ring, title, subtitle);
  shopGrid.appendChild(loading);

  setStatus("VERBINDE MIT DER ZONE...");

  try {
    const response = await fetch(API_URL, {
      headers: {
        "Accept": "application/json",
        "x-api-key": API_KEY
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`API antwortet mit HTTP ${response.status}`);
    }

    const result = await response.json();
    const entries = getShopEntries(result);

    if (!entries.length) {
      throw new Error("Die API hat keine Shop-Items zurückgegeben.");
    }

    allItems = entries;
    filterItems();
    setStatus("ZONE ONLINE // SHOP ERFOLGREICH GELADEN", true);
  } catch (error) {
    console.error("Dropzone Shop Fehler:", error);

    shopGrid.replaceChildren();

    const errorPanel = document.createElement("div");
    errorPanel.className = "loading-panel";

    const errorTitle = document.createElement("p");
    errorTitle.textContent = "VERBINDUNG FEHLGESCHLAGEN";

    const errorMessage = document.createElement("span");
    errorMessage.textContent =
      "API nicht erreichbar. Bitte später erneut versuchen.";

    errorPanel.append(errorTitle, errorMessage);
    shopGrid.appendChild(errorPanel);

    setStatus("ZONE OFFLINE // API-FEHLER");
    if (shopCount) shopCount.textContent = "ITEMS —";
  } finally {
    if (refreshButton) {
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
