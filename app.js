"use strict";

const API_URL = "https://fortnite-api.com/v2/shop?language=de";
const API_KEY = "613bf376-b744-4781-917f-707018a83c9a";

const grid = document.getElementById("shopGrid");
const statusBox = document.getElementById("shopStatus");
const searchInput = document.getElementById("shopSearch");
const refreshButton = document.getElementById("refreshShop");
const countLabel = document.getElementById("itemCount");

let items = [];

function textValue(...values) {
  return values.find(value =>
    typeof value === "string" && value.trim()
  ) || "";
}

function getImage(item, entry) {
  const candidates = [
    item?.images?.featured,
    item?.images?.icon,
    item?.images?.other,
    item?.images?.smallIcon,
    item?.displayAssets?.[0]?.url,
    item?.displayAssets?.[0]?.image,
    item?.newDisplayAsset?.renderImages?.[0]?.image,
    item?.newDisplayAsset?.renderImages?.[0]?.url,
    entry?.bundle?.image,
    entry?.displayAssets?.[0]?.url,
    entry?.displayAssets?.[0]?.image,
    entry?.newDisplayAsset?.renderImages?.[0]?.image
  ];

  return candidates.find(value =>
    typeof value === "string" && /^https?:\/\//i.test(value)
  ) || "";
}

function getEntries(data) {
  if (Array.isArray(data?.entries)) return data.entries;

  const sections = [
    data?.featured?.entries,
    data?.daily?.entries,
    data?.specialFeatured?.entries,
    data?.specialDaily?.entries,
    data?.collaborations?.entries
  ];

  return sections.flatMap(section =>
    Array.isArray(section) ? section : []
  );
}

function parseItems(json) {
  const result = [];

  for (const entry of getEntries(json?.data)) {
    const listedItems = Array.isArray(entry?.br) && entry.br.length
      ? entry.br
      : Array.isArray(entry?.items) && entry.items.length
        ? entry.items
        : [entry];

    for (const item of listedItems) {
      const name = textValue(
        item?.name,
        item?.displayName,
        entry?.bundle?.name,
        entry?.name,
        entry?.devName
      );

      const image = getImage(item, entry);
      if (!name || !image) continue;

      const rarity = textValue(
        item?.rarity?.displayValue,
        item?.series?.name,
        item?.rarity?.value,
        item?.type?.displayValue
      ) || "Fortnite";

      const type = textValue(
        item?.type?.displayValue,
        item?.type?.value,
        entry?.section?.name,
        entry?.layout?.name
      ) || "Item Shop";

      let price = null;

      if (Number.isFinite(entry?.finalPrice)) {
        price = entry.finalPrice;
      } else if (Number.isFinite(entry?.price?.finalPrice)) {
        price = entry.price.finalPrice;
      } else if (Number.isFinite(entry?.regularPrice)) {
        price = entry.regularPrice;
      }

      result.push({
        id: item?.id || `${name}-${image}`,
        name,
        image,
        rarity,
        type,
        price
      });
    }
  }

  const seen = new Set();

  return result.filter(item => {
    const key = `${item.name}|${item.image}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function createElement(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.textContent = content;
  return element;
}

function showStatus(message, loading = false) {
  statusBox.classList.remove("hidden");
  statusBox.replaceChildren();

  if (loading) {
    statusBox.append(createElement("span", "spinner"));
  }

  statusBox.append(createElement("span", "", message));
}

function renderItems() {
  const query = searchInput.value.trim().toLowerCase();

  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(query) ||
    item.rarity.toLowerCase().includes(query) ||
    item.type.toLowerCase().includes(query)
  );

  grid.replaceChildren();
  countLabel.textContent = `${filtered.length} ITEMS`;

  if (!filtered.length) {
    showStatus(items.length
      ? "Keine passenden Items gefunden."
      : "Keine Shop-Items mit Bildern gefunden. Bitte API-Antwort prüfen.");
    return;
  }

  statusBox.classList.add("hidden");
  const fragment = document.createDocumentFragment();

  for (const item of filtered) {
    const card = createElement("article", "shop-card");
    const imageArea = createElement("div", "shop-card-image");
    const image = document.createElement("img");

    image.src = item.image;
    image.alt = item.name;
    image.loading = "lazy";
    image.decoding = "async";

    image.addEventListener("error", () => {
      image.remove();
      imageArea.append(
        createElement("span", "image-fallback", "Bild nicht verfügbar")
      );
    }, { once: true });

    imageArea.append(
      image,
      createElement("span", "shop-rarity", item.rarity)
    );

    const details = createElement("div", "shop-card-details");
    details.append(
      createElement("h3", "", item.name),
      createElement("p", "item-type", item.type)
    );

    if (item.price !== null) {
      const price = createElement("div", "shop-price");
      price.append(
        createElement("span", "vbuck-symbol", "V"),
        document.createTextNode(
          `${item.price.toLocaleString("de-DE")} V-Bucks`
        )
      );
      details.append(price);
    }

    card.append(imageArea, details);
    fragment.append(card);
  }

  grid.append(fragment);
}

async function loadShop() {
  refreshButton.disabled = true;
  showStatus("Item-Shop wird geladen ...", true);
  countLabel.textContent = "LÄDT ...";

  try {
    const response = await fetch(API_URL, {
      headers: {
        Accept: "application/json",
        "x-api-key": API_KEY
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();

    if (json?.status && json.status !== 200) {
      throw new Error(json.error || "API-Fehler");
    }

    items = parseItems(json);

    if (!items.length) {
      countLabel.textContent = "0 ITEMS";
      showStatus(
        "Die API lieferte keine verwendbaren Shop-Bilder. Öffne F12 → Console für Details."
      );
      console.warn("Shop-Antwort:", json);
      return;
    }

    renderItems();
  } catch (error) {
    console.error("DROPZONE Shop-Fehler:", error);
    countLabel.textContent = "FEHLER";
    showStatus(
      "Shop konnte nicht geladen werden. Mögliche Ursachen: API nicht erreichbar, Zugriff verweigert oder Anfrage blockiert."
    );
  } finally {
    refreshButton.disabled = false;
  }
}

searchInput.addEventListener("input", renderItems);
refreshButton.addEventListener("click", loadShop);

loadShop();
