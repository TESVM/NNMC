import { createSession, getCredentials, json, parseJson, sha256 } from "./_lib/store.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const body = await parseJson(req);
  const username = body?.username?.trim();
  const password = body?.password || "";
  if (!username || !password) return json({ error: "Username and password are required." }, 400);

  const credentials = await getCredentials();
  const passwordHash = await sha256(password);
  if (username !== credentials.username || passwordHash !== credentials.passwordHash) {
    return json({ error: "Invalid username or password." }, 401);
  }

  const token = await createSession(username);
  return json({ token, username });
};
