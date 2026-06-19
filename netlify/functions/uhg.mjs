export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
  const url = new URL(req.url);
  const page = url.searchParams.get("page");
  if (!page || !/^[a-z0-9_]+$/.test(page)) {
    return new Response(JSON.stringify({ error: "Invalid page" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
  try {
    const upstream = await fetch(`https://uhg.readthedocs.io/en/latest/${page}.html`);
    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: "Page not found", text: "" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
    const html = await upstream.text();
    const text = html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\[.*?\]/g, '')
      .trim()
      .slice(0, 6000);
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, text: "" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
};
export const config = { path: "/api/uhg" };
