import { getContent, json, parseJson, requireSession, saveContent } from "./_lib/store.mjs";

export default async (req) => {
  if (req.method === "GET") {
    return json({ content: await getContent() });
  }

  if (req.method === "POST") {
    const session = await requireSession(req);
    if (!session) return json({ error: "Unauthorized" }, 401);

    const body = await parseJson(req);
    if (!body) return json({ error: "Invalid request body" }, 400);

    return json({ content: await saveContent(body) });
  }

  return json({ error: "Method not allowed" }, 405);
};
