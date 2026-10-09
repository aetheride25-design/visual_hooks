// Vercel function behind the "Cloud version coming soon" email field (POST /api/waitlist).
// It adds the email to the Hooks visuales mailing list in Loops. The Loops API key stays here, on the server.
//
// Env vars (Vercel → Project → Settings → Environment Variables):
//   LOOPS_API_KEY        Loops → Settings → API
//   LOOPS_HOOKS_LIST_ID  Loops → Audience → Lists → "Hooks visuales" → list ID
//
// It never sends `userGroup`: the Loops account is shared with Director, whose welcome workflow filters on
// userGroup, and a contact has only one. A mailing list adds the person without touching anything else.
const LOOPS = 'https://app.loops.so/api/v1';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const clean = (value, max) => String(value ?? '').trim().slice(0, max);

/** Reads the JSON body whether or not the platform already parsed it. */
const bodyOf = (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  try {
    return JSON.parse(req.body || '{}');
  } catch {
    return {};
  }
};

/**
 * Adds `email` to the list. Returns 'new' for a new contact, 'existing' when the contact was already in Loops
 * (from Director or an earlier sign-up) and was only added to the list.
 */
export const addToList = async ({ email, source }, { apiKey, listId, fetchImpl = fetch }) => {
  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
  const mailingLists = { [listId]: true };
  const created = await fetchImpl(`${LOOPS}/contacts/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, source, mailingLists }),
  });
  if (created.ok) return 'new';
  if (created.status !== 409) throw new Error(`Loops create: HTTP ${created.status}`);

  // Already a contact: only add the list, keeping its source and userGroup as they were.
  const updated = await fetchImpl(`${LOOPS}/contacts/update`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ email, mailingLists }),
  });
  if (!updated.ok) throw new Error(`Loops update: HTTP ${updated.status}`);
  return 'existing';
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method' });
  }
  const body = bodyOf(req);
  // Honeypot: a hidden field people never see. Bots that fill it get a quiet "ok" and nothing is saved.
  if (clean(body.website, 200)) return res.status(200).json({ ok: true, status: 'new' });

  const email = clean(body.email, 254).toLowerCase();
  if (!EMAIL.test(email)) return res.status(400).json({ ok: false, error: 'email' });

  const apiKey = process.env.LOOPS_API_KEY;
  const listId = process.env.LOOPS_HOOKS_LIST_ID;
  if (!apiKey || !listId) {
    console.error('waitlist: LOOPS_API_KEY or LOOPS_HOOKS_LIST_ID is missing');
    return res.status(500).json({ ok: false, error: 'config' });
  }

  try {
    const status = await addToList({ email, source: clean(body.source, 100) || 'Direct' }, { apiKey, listId });
    return res.status(200).json({ ok: true, status });
  } catch (err) {
    console.error('waitlist:', err.message);
    return res.status(502).json({ ok: false, error: 'loops' });
  }
}
