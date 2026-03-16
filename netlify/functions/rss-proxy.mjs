export default async (req) => {
  const url = new URL(req.url);
  const feedUrl = url.searchParams.get("url");

  if (!feedUrl) {
    return new Response(JSON.stringify({ error: "Missing 'url' parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    new URL(feedUrl);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const res = await fetch(feedUrl, {
      headers: {
        "User-Agent": "StelliumReport/1.0 RSS Reader",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: `Upstream returned ${res.status}` }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const xml = await res.text();

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=300, max-age=120",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch feed", detail: err.message }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const config = {
  path: "/api/rss-proxy",
};
