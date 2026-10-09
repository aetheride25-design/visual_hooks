import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseList, parsePoll, winnerOf } from './lists.ts';

test('parseList trims, drops empty lines and numbering, and caps the count', () => {
  assert.deepEqual(parseList('1. Cursor\n\n- Claude\n• v0\n4) Bolt', 3), ['Cursor', 'Claude', 'v0']);
  assert.deepEqual(parseList('  ', 3), []);
  // A number that's part of the item stays.
  assert.deepEqual(parseList('3 tools', 3), ['3 tools']);
});

test('parsePoll scales to 100 and keeps the rounded numbers adding up', () => {
  const p = parsePoll('Yes | 1\nNo | 2');
  assert.deepEqual(p.map((o) => o.pct), [33, 67]);
  const three = parsePoll('A | 1\nB | 1\nC | 1');
  assert.equal(three.reduce((s, o) => s + o.pct, 0), 100);
});

test('parsePoll splits what is left among options without a number', () => {
  assert.deepEqual(parsePoll('A | 60\nB\nC').map((o) => o.pct), [60, 20, 20]);
  assert.deepEqual(parsePoll('A\nB').map((o) => o.pct), [50, 50]);
  assert.deepEqual(parsePoll('A | 70%\nB | 30%').map((o) => o.pct), [70, 30]);
  assert.deepEqual(parsePoll(''), []);
});

test('winnerOf picks the biggest share, the first on a tie', () => {
  assert.equal(winnerOf(parsePoll('A | 40\nB | 60')), 1);
  assert.equal(winnerOf(parsePoll('A\nB')), 0);
});
