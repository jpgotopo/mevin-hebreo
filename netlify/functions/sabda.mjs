// Proxy para Alkitab SABDA (TB, BIMK/BIS y NASB). Devuelve el texto de un versículo.
// TB y BIMK: © Lembaga Alkitab Indonesia; texto servido por Yayasan Lembaga SABDA.
const H = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

function decode(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ").trim();
}

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...H, "Access-Control-Allow-Methods": "GET, OPTIONS" } });
  }
  const u = new URL(req.url);
  const book = (u.searchParams.get("book") || "").trim();
  const ch = u.searchParams.get("ch");
  const vs = u.searchParams.get("vs");
  const ver = u.searchParams.get("ver");
  if (!/^[1-3]?\s?[A-Za-z]{2,}$/.test(book) || !/^\d+$/.test(ch || "") || !/^\d+$/.test(vs || "") || !["tb", "bis", "nasb"].includes(ver)) {
    return new Response(JSON.stringify({ error: "Parametros invalidos" }), { status: 400, headers: H });
  }
  const passage = book.replace(/\s+/g, "+") + "+" + ch + ":" + vs;
  try {
    const r = await fetch(`https://alkitab.sabda.org/api/passage.php?passage=${passage}&ver=${ver}`);
    if (!r.ok) {
      return new Response(JSON.stringify({ error: "SABDA HTTP " + r.status }), { status: 502, headers: H });
    }
    const xml = await r.text();
    let text = "";
    for (const m of xml.matchAll(/<verse>([\s\S]*?)<\/verse>/g)) {
      const num = (m[1].match(/<number>\s*(\d+)\s*<\/number>/) || [])[1];
      const t = (m[1].match(/<text>([\s\S]*?)<\/text>/) || [])[1];
      if (num === vs && t) { text = decode(t); break; }
    }
    return new Response(JSON.stringify({ text, ver }), {
      status: text ? 200 : 404,
      headers: { ...H, "Cache-Control": "public, max-age=86400" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: H });
  }
};
export const config = { path: "/api/sabda" };
