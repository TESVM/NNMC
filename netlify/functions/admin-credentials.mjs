import { json, parseJson, requireSession, saveCredentials } from "./_lib/store.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const session = await requireSession(req);
  if (!session) return json({ error: "Unauthorized" }, 401);

  const body = await parseJson(req);
  const username = body?.username?.trim();
  const password = body?.password || "";
  if (!username) return json({ error: "Username is required." }, 400);
  if (password.length < 6) return json({ error: "Password must be at least 6 characters." }, 400);

  await saveCredentials({ username, password });
  return json({ ok: true, username });
};
