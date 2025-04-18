/**
 * Cloudflare Pages Function
 * Route:  /api/visitors
 *
 * – Requires a KV namespace bound as COUNTER –
 *   Pages ▸ Functions ▸ Settings ▸ KV Bindings ▸ “COUNTER”
 */
export async function onRequestGet({ request, env }) {
    /* ---------- 1  check the cookie ---------- */
    const cookies = Object.fromEntries(
      (request.headers.get('Cookie') || '')
        .split(/;\s*/)
        .map(s => s.split('='))
        .filter(p => p.length === 2)
    );
    const known = cookies.vid;
  
    /* ---------- 2  read / increment counter ---------- */
    let total = +(await env.COUNTER.get('total')) || 0;
    if (!known) {
      total = total + 1;
      await env.COUNTER.put('total', total.toString());   // eventual‑consistency write
    }
  
    /* ---------- 3  edge‑cached JSON response ---------- */
    return new Response(JSON.stringify({ total }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': known
          ? undefined
          : `vid=${crypto.randomUUID()}; Path=/; Max-Age=31536000; SameSite=Lax`,
        'Cache-Control': 'public, max-age=60'
      }
    });
  }
  