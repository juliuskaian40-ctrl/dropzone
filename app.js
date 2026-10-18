
"use strict";

// Öffentliche Shop-Datenquelle. Kein API-Key im Browser erforderlich.
const SHOP_API_URL = "https://fortnite-api.com/v2/shop?language=de";

const grid = document.getElementById("shopGrid");
const statusBox = document.getElementById("shopStatus");
const searchInput = document.getElementById("shopSearch");
const refreshButton = document.getElementById("refreshShop");
const countLabel = document.getElementById("itemCount");

let allItems = [];

function firstText(...values) {
  return values.find(value =>
    typeof value === "string" && value.trim().length > 0
  ) || "";
}

function findImage(item, entry) {
  const renderImages = item?.newDisplayAsset?.renderImages;
  const entryRenderImages = entry?.newDisplayAsset?.renderImages;

  return firstText(
    item?.images?.featured,
    item?.images?.icon,
    item?.images?.other,
    item?.images?.smallIcon,
    item?.displayAssets?.[0]?.url,
    item?.displayAssets?.[0]?.image,
    renderImages?.[0]?.image,
    renderImages?.[0]?.url,
    entry?.bundle?.image,
    entry?.displayAssets?.[0]?.url,
    entry?.displayAssets?.[0]?.image,
    entryRenderImages?.[0]?.image,
    entryRenderImages?.[0]?.url
  );
}

function findRarity(item) {
  return firstText(
    item?.rarity?.displayValue,
    item?.series?.name,
    item?.rarity?.value,
    item?.type?.displayValue,
    item?.type?.value
  ) || "Fortnite";
}

function normalizeShop(json) {
  const data = json?.data;
  let entries = [];

  // Fortnite-API.com v2 liefert üblicherweise data.entries.
  if (Array.isArray(data?.entries)) {
    entries = data.entries;
  } else {
    // Fallback für Antworten mit getrennten Shop-Sektionen.
    const sections = [
      data?.featured?.entries,
      data?.daily?.entries,
      data?.specialFeatured?.entries,
      data?.specialDaily?.entries,
      data?.collaborations?.entries
    ];

    entries = sections.flatMap(section =>
      Array.isArray(section) ? section : []
    );
  }

  const result = [];

  for (const entry of entries) {
    const items = Array.isArray(entry?.br) && entry.br.length
      ? entry.br
      : Array.isArray(entry?.items) && entry.items.length
        ? entry.items
        : [entry];

    const bundleName = entry?.bundle?.name;

    for (const item of items) {
      const image = findImage(item, entry);
      const name = firstText(
        item?.name,
        item?.displayName,
        bundleName,
        entry?.name,
        entry?.devName
      );

      if (!image || !name) continue;

      result.push({
        id: item?.id || entry?.offerId || `${name}-${image}`,
        name,
        image,
        rarity: findRarity(item),
        type: firstText(
          item?.type?.displayValue,
          item?.type?.value,
          item?.type,
          entry?.layout?.name,
          entry?.section?.name
        ) || "Item Shop",
        price: Number.isFinite(entry?.finalPrice)
          ? entry.finalPrice
          : Number.isFinite(entry?.price?.finalPrice)
            ? entry.price.finalPrice
            : Number.isFinite(entry?.regularPrice)
              ? entry.regularPrice
              : null
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

function makeElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;

  return element;
}

function renderShop() {
  const query = (searchInput?.value || "").trim().toLowerCase();

  const filtered = allItems.filter(item =>
    item.name.toLowerCase().includes(query) ||
    item.rarity.toLowerCase().includes(query) ||
    item.type.toLowerCase().includes(query)
  );

  grid.replaceChildren();
  countLabel.textContent = `${filtered.length} ITEMS`;

  if (filtered.length === 0) {
    const message = allItems.length
      ? "Keine Items gefunden. Versuche einen anderen Suchbegriff."
      : "Keine Items mit Bildern gefunden. Die API-Antwort muss geprüft werden.";

    statusBox.classList.remove("hidden");
    statusBox.replaceChildren(makeElement("span", "", message));
    return;
  }

  statusBox.classList.add("hidden");

  const fragment = document.createDocumentFragment();

  for (const item of filtered) {
    const card = makeElement("article", "shop-card");

    const imageArea = makeElement("div", "shop-card-image");
    const image = document.createElement("img");

    image.src = item.image;
    image.alt = item.name;
    image.loading = "lazy";
    image.decoding = "async";

    image.addEventListener("error", () => {
      imageArea.classList.add("image-error");
      image.remove();
      imageArea.append(
        makeElement("span", "image-fallback", "Bild nicht verfügbar")
      );
    }, { once: true });

    const rarity = makeElement("span", "shop-rarity", item.rarity);
    imageArea.append(image, rarity);

    const details = makeElement("div", "shop-card-details");
    const title = makeElement("h3", "", item.name);
    const type = makeElement("p", "item-type", item.type);

    details.append(title, type);

    if (item.price !== null) {
      const price = makeElement("div", "shop-price");
      price.append(
        makeElement("span", "vbuck-symbol", "V"),
        document.createTextNode(`${item.price.toLocaleString("de-DE")} V-Bucks`)
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
  refreshButton.setAttribute("aria-busy", "true");
  statusBox.classList.remove("hidden");
  statusBox.replaceChildren(
    makeElement("span", "loading-spinner"),
    makeElement("span", "", "Item-Shop wird geladen ...")
  );

  try {
    const response = await fetch(SHOP_API_URL, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();

    if (json?.status && json.status !== 200) {
      throw new Error(json.error || "Die API hat einen Fehler zurückgegeben.");
    }

    allItems = normalizeShop(json);

    if (allItems.length === 0) {
      countLabel.textContent = "0 ITEMS";
      statusBox.replaceChildren(
        makeElement(
          "span",
          "",
          "Die API hat geantwortet, aber keine verwendbaren Shop-Bilder geliefert. Öffne die Entwicklerkonsole für Details."
        )
      );
      console.warn("Unerwartete Shop-Antwort:", json);
      return;
    }

    renderShop();
  } catch (error) {
    console.error("DROPZONE Item-Shop:", error);

    countLabel.textContent = "OFFLINE";
    statusBox.replaceChildren(
      makeElement(
        "span",
        "",
        "Shop konnte nicht geladen werden. Prüfe deine Internetverbindung, die API und die Browserkonsole."
      )
    );
  } finally {
    refreshButton.disabled = false;
    refreshButton.removeAttribute("aria-busy");
  }
}

searchInput.addEventListener("input", renderShop);
refreshButton.addEventListener("click", loadShop);

loadShop();
