import test from "node:test";
import assert from "node:assert/strict";
import { DEPTH_THEMES, depthBandForFloor, depthThemeForBand, depthThemeForFloor } from "../app/depth-themes.ts";

test("maps all one hundred floors into ten stable regions", () => {
  assert.equal(DEPTH_THEMES.length, 10);
  assert.equal(depthBandForFloor(1), 1);
  assert.equal(depthBandForFloor(10), 1);
  assert.equal(depthBandForFloor(11), 2);
  assert.equal(depthBandForFloor(90), 9);
  assert.equal(depthBandForFloor(91), 10);
  assert.equal(depthBandForFloor(100), 10);
  assert.equal(depthBandForFloor(-20), 1);
  assert.equal(depthBandForFloor(500), 10);
});

test("gives every region a distinct identity and music signature", () => {
  const names = new Set(DEPTH_THEMES.map(theme => theme.name));
  const marks = new Set(DEPTH_THEMES.map(theme => theme.mark));
  const signatures = new Set(DEPTH_THEMES.map(theme => JSON.stringify(theme.music)));
  assert.equal(names.size, 10);
  assert.equal(marks.size, 10);
  assert.equal(signatures.size, 10);
  for (const theme of DEPTH_THEMES) {
    assert.equal(theme.ornaments.length, 2);
    assert.ok(theme.subtitle.length >= 8);
    assert.ok(theme.music.density >= 1 && theme.music.density <= 4);
  }
});

test("clamps invalid floor and band requests without touching save data", () => {
  assert.equal(depthThemeForFloor(Number.NaN), DEPTH_THEMES[0]);
  assert.equal(depthThemeForBand(0), DEPTH_THEMES[0]);
  assert.equal(depthThemeForBand(99), DEPTH_THEMES[9]);
  assert.equal(depthThemeForFloor(61).name, "氷哭洞");
});
