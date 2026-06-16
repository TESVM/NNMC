import { json, requireSession } from "./_lib/store.mjs";

export default async (req) => {
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const session = await requireSession(req);
  if (!session) return json({ error: "Unauthorized" }, 401);

  return json({ authenticated: true, username: session.username });
};
