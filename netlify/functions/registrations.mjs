import {
  addRegistration,
  clearRegistrations,
  deleteRegistrationById,
  getRegistrations,
  json,
  parseJson,
  requireSession
} from "./_lib/store.mjs";

export default async (req) => {
  if (req.method === "POST") {
    const body = await parseJson(req);
    if (!body?.fullName || !body?.phone || !body?.church || !body?.pastor) {
      return json({ error: "Missing required registration fields." }, 400);
    }
    return json({ registration: await addRegistration(body) }, 201);
  }

  const session = await requireSession(req);
  if (!session) return json({ error: "Unauthorized" }, 401);

  if (req.method === "GET") {
    return json({ registrations: await getRegistrations() });
  }

  if (req.method === "DELETE") {
    const body = await parseJson(req);
    if (body?.clearAll) {
      return json({ registrations: await clearRegistrations() });
    }
    if (!body?.id) return json({ error: "Registration id is required." }, 400);
    return json({ registrations: await deleteRegistrationById(body.id) });
  }

  return json({ error: "Method not allowed" }, 405);
};
