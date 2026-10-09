import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler, { addToList } from '../api/waitlist.js';

const reply = (status) => ({ ok: status >= 200 && status < 300, status });

/** Fake fetch that answers each call with the next status and records what was sent. */
const fakeFetch = (...statuses) => {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, method: init.method, body: JSON.parse(init.body), auth: init.headers.Authorization });
    return reply(statuses[calls.length - 1]);
  };
  fn.calls = calls;
  return fn;
};

const opts = (fetchImpl) => ({ apiKey: 'key', listId: 'list1', fetchImpl });

test('a new email is created in the Hooks list, without userGroup', async () => {
  const f = fakeFetch(200);
  assert.equal(await addToList({ email: 'a@b.co', source: 'x.com' }, opts(f)), 'new');
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].url, 'https://app.loops.so/api/v1/contacts/create');
  assert.equal(f.calls[0].auth, 'Bearer key');
  assert.deepEqual(f.calls[0].body, { email: 'a@b.co', source: 'x.com', mailingLists: { list1: true } });
});

test('an existing contact (409) is only added to the list, keeping its source', async () => {
  const f = fakeFetch(409, 200);
  assert.equal(await addToList({ email: 'a@b.co', source: 'x.com' }, opts(f)), 'existing');
  assert.equal(f.calls[1].method, 'PUT');
  assert.equal(f.calls[1].url, 'https://app.loops.so/api/v1/contacts/update');
  assert.deepEqual(f.calls[1].body, { email: 'a@b.co', mailingLists: { list1: true } });
});

test('other Loops errors throw', async () => {
  await assert.rejects(addToList({ email: 'a@b.co' }, opts(fakeFetch(500))));
  await assert.rejects(addToList({ email: 'a@b.co' }, opts(fakeFetch(409, 400))));
});

/** Minimal stand-in for Vercel's res. */
const fakeRes = () => {
  const res = { code: 0, data: null, headers: {} };
  res.status = (c) => ((res.code = c), res);
  res.json = (d) => ((res.data = d), res);
  res.setHeader = (k, v) => (res.headers[k] = v);
  return res;
};

test('handler rejects bad input before calling Loops', async () => {
  let res = fakeRes();
  await handler({ method: 'GET' }, res);
  assert.equal(res.code, 405);

  res = fakeRes();
  await handler({ method: 'POST', body: { email: 'nope' } }, res);
  assert.deepEqual([res.code, res.data.error], [400, 'email']);

  res = fakeRes();
  await handler({ method: 'POST', body: { email: 'bot@spam.co', website: 'http://spam' } }, res);
  assert.deepEqual([res.code, res.data.ok], [200, true]);
});

test('handler says when the env vars are missing', async () => {
  delete process.env.LOOPS_API_KEY;
  const res = fakeRes();
  const log = console.error;
  console.error = () => {};
  await handler({ method: 'POST', body: '{"email":"A@B.co"}' }, res);
  console.error = log;
  assert.deepEqual([res.code, res.data.error], [500, 'config']);
});
