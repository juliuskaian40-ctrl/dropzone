export async function onRequest(context) {
  const apiKey = context.env.FORTNITE_API_KEY;

  if (613bf376-b744-4781-917f-707018a83c9a) {
    return Response.json(
      { error: "Shop API is not configured. Set the FORTNITE_API_KEY environment variable." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  const requestedLanguage = new URL(context.request.url).searchParams.get("language") || "de";
  const language = ["de", "en"].includes(requestedLanguage) ? requestedLanguage : "de";

  try {
    const upstream = await fetch(
      `https://fortnite-api.com/v2/shop?language=${encodeURIComponent(language)}`,
      {
        headers: {
          "Authorization": `ApiKey ${apiKey}`,
          Accept: "application/json"
        }
      }
    );

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return Response.json(
      { error: "The Fortnite shop API could not be reached." },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
/* Begrenzt die Größe aller Bilder im Shop, damit sie sauber dargestellt werden */
.shop-item img, 
.shop-container img, 
#shop img {
  width: 100% !important;
  max-width: 150px !important; /* Passe diesen Wert an, wenn sie noch kleiner/größer sein sollen */
  height: auto !important;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}

/* Optional: Falls die einzelnen Shop-Karten (Container) zu klein sind */
.shop-item, 
.shop-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
