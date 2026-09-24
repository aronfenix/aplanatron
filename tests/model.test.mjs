import test from 'node:test';
import assert from 'node:assert/strict';
import { profileKey, cleanProgress, mergeProgress, preserveAchievements } from '../src/model.js';

test('solo and pair records are distinct and shared in either partner order', () => {
  assert.equal(profileKey('alba'), 'solo:alba');
  assert.equal(profileKey('alba', 'diego'), 'pair:alba:diego');
  assert.equal(profileKey('diego', 'alba'), 'pair:alba:diego');
  assert.throws(() => profileKey('alba', 'alba'));
});

test('the server validates eight score slots and other progress', () => {
  const valid = cleanProgress({ stars: [1, 2, 3, 0, 0, 1, 0, 0], best: [100, 50, 0, 0, 0, 0, 0, 0], sheets: ['q2'], avs: [1] });
  assert.equal(valid.best[0], 100);
  assert.deepEqual(valid.sheets, ['q2']);
  assert.throws(() => cleanProgress({ stars: [4, 0, 0, 0, 0, 0, 0, 0] }));
  assert.throws(() => cleanProgress({ best: [100] }));
  assert.throws(() => cleanProgress({ miss: { q2: 99 } }));
  assert.throws(() => cleanProgress({ hubPos: [Infinity, 0] }));
});

test('simultaneous devices keep each highest score and collected sheet', () => {
  const a = { stars: [1, 0, 0, 0, 0, 0, 0, 0], best: [120, 0, 0, 0, 0, 0, 0, 0], sheets: ['q2'], seenIntro: true };
  const b = { stars: [0, 2, 0, 0, 0, 0, 0, 0], best: [90, 80, 0, 0, 0, 0, 0, 0], sheets: ['q6'] };
  const merged = mergeProgress(a, b);
  assert.deepEqual(merged.best.slice(0, 2), [120, 80]);
  assert.deepEqual(merged.stars.slice(0, 2), [1, 2]);
  assert.deepEqual(merged.sheets, ['q2', 'q6']);
  assert.equal(merged.seenIntro, true);
});

test('later saves cannot erase an earned record', () => {
  const incoming = { stars: [0, 0, 0, 0, 0, 0, 0, 0], best: [70, 0, 0, 0, 0, 0, 0, 0], sheets: [] };
  const stored = { stars: [2, 0, 0, 0, 0, 0, 0, 0], best: [120, 0, 0, 0, 0, 0, 0, 0], sheets: ['q2'] };
  const result = preserveAchievements(incoming, stored);
  assert.equal(result.stars[0], 2);
  assert.equal(result.best[0], 120);
  assert.deepEqual(result.sheets, ['q2']);
});
