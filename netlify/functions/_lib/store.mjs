import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";

export const DEFAULT_CONTENT = {
  event: {
    eyebrow: "AOH Church of God",
    title: "Northern North Ministerial Council",
    subtitle: "Three days of preaching, fellowship, and ministry development from Friday through Sunday.",
    date: "Friday, October 17, 2025 - Sunday, October 19, 2025",
    time: "Morning and Night Services Daily",
    location: "Chicago, Illinois",
    ctaText: "Register Now",
    logoData: "",
    countdownTarget: ""
  },
  about: {
    label: "Our Mission",
    title: "About This Council",
    p1: "The Northern North Ministerial Council exists to strengthen ministers, foster unity, and create room for prayerful leadership development across the region.",
    p2: "This gathering brings pastors, elders, ministry leaders, and workers together for fellowship, preaching, practical instruction, and shared encouragement.",
    quote: "\"For the equipping of the saints for the work of ministry, for the edifying of the body of Christ.\""
  },
  speakers: [
    { name: "Bishop Grace Holloway", role: "Presiding Bishop", photoData: "" },
    { name: "Overseer Nathan Brooks", role: "Regional Overseer", photoData: "" },
    { name: "Pastor Elise Carter", role: "Guest Speaker", photoData: "" },
    { name: "Elder Marcus Dean", role: "Leadership Session", photoData: "" },
    { name: "Pastor Naomi Fields", role: "Prayer and Worship", photoData: "" },
    { name: "Minister Caleb Sutton", role: "Emerging Leaders Forum", photoData: "" },
    { name: "Dr. Hannah Reeves", role: "Family Ministry Session", photoData: "" }
  ],
  workshops: [
    { title: "Church Growth and Community Impact", facilitator: "Overseer Nathan Brooks", description: "Held after the morning preaching service with practical instruction on outreach planning, discipleship rhythm, and local church impact." },
    { title: "Women in Ministry Leadership", facilitator: "Pastor Elise Carter", description: "A morning workshop track focused on leadership development, mentorship, and service across ministry settings." },
    { title: "Next Generation Ministry Lab", facilitator: "Minister Caleb Sutton", description: "Scheduled after morning preaching for leaders building strong youth and young adult ministry structure." }
  ],
  schedule: [
    { time: "Friday 10:00 AM", title: "Morning Preaching Service", speaker: "Featured Morning Speaker" },
    { time: "Friday 12:00 PM", title: "Morning Workshops", speaker: "Workshop Facilitators" },
    { time: "Friday 7:00 PM", title: "Night Preaching Service", speaker: "Featured Night Speaker" },
    { time: "Saturday 10:00 AM", title: "Morning Preaching Service", speaker: "Featured Morning Speaker" },
    { time: "Saturday 12:00 PM", title: "Morning Workshops", speaker: "Workshop Facilitators" },
    { time: "Saturday 7:00 PM", title: "Night Preaching Service", speaker: "Featured Night Speaker" },
    { time: "Sunday 10:00 AM", title: "Morning Preaching Service", speaker: "Featured Morning Speaker" },
    { time: "Sunday 12:00 PM", title: "Morning Workshops", speaker: "Workshop Facilitators" },
    { time: "Sunday 6:00 PM", title: "Closing Night Service", speaker: "Featured Night Speaker" }
  ],
  venue: {
    name: "Northern North Assembly Hall",
    address: "123 Ministry Lane",
    cityState: "Chicago, Illinois",
    email: "council@example.org",
    phone: "(000) 000-0000",
    arrival: "Doors open 30 minutes before the first session. Please arrive early for check-in and fellowship."
  },
  pricing: {
    earlyLabel: "Early Registration",
    earlyPrice: "25",
    regularLabel: "Regular Registration",
    regularPrice: "35",
    paymentMethods: "CashApp, Zelle, Pay at door"
  }
};

const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "nnmc2025";
const CONTENT_KEY = "content";
const REGISTRATIONS_KEY = "entries";
const CREDENTIALS_KEY = "credentials";
const SESSION_PREFIX = "session:";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12;

function contentStore() {
  return getStore("nnmc-site-content");
}

function registrationStore() {
  return getStore("nnmc-registrations");
}

function authStore() {
  return getStore("nnmc-admin");
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

export async function parseJson(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export function mergeContent(stored = {}) {
  return {
    event: { ...DEFAULT_CONTENT.event, ...(stored.event || {}) },
    about: { ...DEFAULT_CONTENT.about, ...(stored.about || {}) },
    speakers: Array.isArray(stored.speakers) && stored.speakers.length
      ? stored.speakers.map((speaker, index) => ({ ...DEFAULT_CONTENT.speakers[index % DEFAULT_CONTENT.speakers.length], ...speaker }))
      : structuredClone(DEFAULT_CONTENT.speakers),
    workshops: Array.isArray(stored.workshops) && stored.workshops.length ? stored.workshops : structuredClone(DEFAULT_CONTENT.workshops),
    schedule: Array.isArray(stored.schedule) && stored.schedule.length ? stored.schedule : structuredClone(DEFAULT_CONTENT.schedule),
    venue: { ...DEFAULT_CONTENT.venue, ...(stored.venue || {}) },
    pricing: { ...DEFAULT_CONTENT.pricing, ...(stored.pricing || {}) }
  };
}

export async function getContent() {
  const stored = await contentStore().get(CONTENT_KEY, { type: "json" });
  return mergeContent(stored || {});
}

export async function saveContent(content) {
  const merged = mergeContent(content || {});
  await contentStore().setJSON(CONTENT_KEY, merged);
  return merged;
}

export async function getRegistrations() {
  return await registrationStore().get(REGISTRATIONS_KEY, { type: "json" }) || [];
}

export async function saveRegistrations(registrations) {
  await registrationStore().setJSON(REGISTRATIONS_KEY, registrations);
  return registrations;
}

export async function addRegistration(payload) {
  const registrations = await getRegistrations();
  const nextEntry = {
    ...payload,
    id: payload?.id || crypto.randomUUID(),
    createdAt: payload?.createdAt || new Date().toISOString()
  };
  registrations.push(nextEntry);
  await saveRegistrations(registrations);
  return nextEntry;
}

export async function deleteRegistrationById(id) {
  const registrations = await getRegistrations();
  const next = registrations.filter((entry) => String(entry.id) !== String(id));
  await saveRegistrations(next);
  return next;
}

export async function clearRegistrations() {
  await saveRegistrations([]);
  return [];
}

export async function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

export async function getCredentials() {
  const stored = await authStore().get(CREDENTIALS_KEY, { type: "json" });
  if (stored?.username && stored?.passwordHash) {
    return stored;
  }
  return {
    username: DEFAULT_USERNAME,
    passwordHash: await sha256(DEFAULT_PASSWORD)
  };
}

export async function saveCredentials({ username, password }) {
  const credentials = {
    username,
    passwordHash: await sha256(password)
  };
  await authStore().setJSON(CREDENTIALS_KEY, credentials);
  return credentials;
}

export async function createSession(username) {
  const token = crypto.randomUUID();
  const session = {
    username,
    expiresAt: Date.now() + SESSION_DURATION_MS
  };
  await authStore().setJSON(`${SESSION_PREFIX}${token}`, session);
  return token;
}

export async function getSession(token) {
  if (!token) return null;
  const session = await authStore().get(`${SESSION_PREFIX}${token}`, { type: "json" });
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    await authStore().delete(`${SESSION_PREFIX}${token}`);
    return null;
  }
  return session;
}

export async function requireSession(req) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  return getSession(token);
}
