/**
 * Cloudflare Pages Function
 * Route:  /api/registerUser
 *
 * Accepts:  POST  { "userId": "abc123" }
 * Returns:  { "status": "registered" | "exists" | "error" }
 *
 * – KV namespace binding: USERS –
 *   Cloudflare Dashboard ▸ Pages ▸ Functions ▸ Settings ▸ “USERS”
 */
export async function onRequestPost({ request, env }) {
    try {
      const { userId } = await request.json();
  
      if (!userId || typeof userId !== "string") {
        return new Response(
          JSON.stringify({ status: "error", msg: "invalid‑id" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
  
      const already = await env.USERS.get(userId);
      if (already !== null) {
        return new Response(
          JSON.stringify({ status: "exists" }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
  
      await env.USERS.put(userId, "1");
      return new Response(
        JSON.stringify({ status: "registered" }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ status: "error", msg: err.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
  