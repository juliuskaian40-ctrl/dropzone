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
