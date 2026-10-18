export async function onRequest(context) {
  const apiKey = 613bf376-b744-4781-917f-707018a83c9a;

  const requestedLanguage = new URL(context.request.url).searchParams.get("language") || "de";
  const language = ["de", "en"].includes(requestedLanguage) ? requestedLanguage : "de";

  try {
    const upstream = await fetch(
      `https://fortnite-api.com/v2/shop?language=${encodeURIComponent(language)}`,
      {
        headers: {
          "Authorization": apiKey,
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
