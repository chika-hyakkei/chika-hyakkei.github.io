import assert from "node:assert/strict";
import test from "node:test";
import { detectLocale, normalizeQuestKey, translate } from "../app/i18n.ts";

test("uses a saved supported locale before browser language",()=>{
  assert.equal(detectLocale("ja",["en-US"]),"ja");
  assert.equal(detectLocale("en",["ja-JP"]),"en");
});

test("detects English and otherwise falls back to Japanese",()=>{
  assert.equal(detectLocale(null,["en-US","ja-JP"]),"en");
  assert.equal(detectLocale(null,["fr-FR"]),"ja");
  assert.equal(detectLocale("broken",[]),"ja");
});

test("falls back to Japanese when an English key is not translated",()=>{
  assert.equal(translate("en","language.ja"),"日本語");
  assert.equal(translate("ja","start.descend"),"地下へ降りる");
});

test("migrates legacy Japanese quest labels to stable ids",()=>{
  assert.equal(normalizeQuestKey("討伐依頼：魔物を8体倒す"),"slay");
  assert.equal(normalizeQuestKey("chests"),"chests");
  assert.equal(normalizeQuestKey("unknown"),"slay");
});
