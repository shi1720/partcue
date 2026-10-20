import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Lens executes the exact shared core covered by the domain tests', async () => {
  const [shared, lens] = await Promise.all([
    readFile(new URL('../core/index.ts', import.meta.url), 'utf8'),
    readFile(new URL('../lens/PartTrail/Assets/Scripts/PartTrailCore.ts', import.meta.url), 'utf8'),
  ]);
  assert.equal(lens, shared, 'Keep the dependency-free Lens copy synchronized with core/index.ts; rerun Lens preview after changing it.');
});
