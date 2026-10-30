#!/usr/bin/env node
/* Validates the data/*.json files against the shape the site expects.
   No dependencies. Exits 1 on the first file that fails. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);

function load(file) {
  try {
    return JSON.parse(readFileSync(join(root, file), "utf8"));
  } catch (e) {
    err(file, `JSON invalide — ${e.message}`);
    return null;
  }
}

const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const isArr = (v) => Array.isArray(v);
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const isUrl = (v) => isStr(v) && /^https?:\/\/\S+$/i.test(v);

function requireFields(file, obj, fields, where = "") {
  for (const f of fields) {
    if (!isStr(obj?.[f])) err(file, `${where}champ requis manquant ou vide : "${f}"`);
  }
}

/* ---- site.json ---- */
(() => {
  const file = "data/site.json";
  const d = load(file);
  if (!d) return;
  if (!isObj(d)) return err(file, "doit être un objet JSON");
  requireFields(file, d, ["name", "statement_line_1", "statement_line_2", "tagline"]);
  if (!isArr(d.stats)) err(file, '"stats" doit être une liste');
  else d.stats.forEach((s, i) => requireFields(file, s, ["value", "label"], `stats[${i}] : `));
  if (!isObj(d.links)) err(file, '"links" doit être un objet');
  if (d.ctf && !isArr(d.ctf)) err(file, '"ctf" doit être une liste');
  (d.ctf || []).forEach((c, i) => {
    if (!isStr(c.platform)) err(file, `ctf[${i}] : "platform" requis`);
    if (c.url && !isUrl(c.url)) err(file, `ctf[${i}] : url invalide (${c.url})`);
  });
})();

/* ---- about.json ---- */
(() => {
  const file = "data/about.json";
  const d = load(file);
  if (!d) return;
  if (!isObj(d)) return err(file, "doit être un objet JSON");
  if (!isStr(d.summary)) err(file, '"summary" requis');
  ["formations", "experiences", "skills"].forEach((k) => {
    if (!isArr(d[k])) err(file, `"${k}" doit être une liste`);
  });
  (d.formations || []).forEach((f, i) => requireFields(file, f, ["period", "title"], `formations[${i}] : `));
  (d.experiences || []).forEach((f, i) => requireFields(file, f, ["period", "title"], `experiences[${i}] : `));
  (d.skills || []).forEach((s, i) => {
    if (!isStr(s.group)) err(file, `skills[${i}] : "group" requis`);
    if (!isArr(s.items)) err(file, `skills[${i}] : "items" doit être une liste`);
  });
})();

/* ---- certs.json ---- */
(() => {
  const file = "data/certs.json";
  const d = load(file);
  if (!d) return;
  if (!isObj(d)) return err(file, "doit être un objet JSON");
  ["obtained", "in_progress", "platforms"].forEach((k) => {
    if (d[k] && !isArr(d[k])) err(file, `"${k}" doit être une liste`);
  });
  [...(d.obtained || []), ...(d.in_progress || [])].forEach((c, i) => {
    if (!isStr(c.name)) err(file, `certification #${i + 1} : "name" requis`);
  });
  (d.platforms || []).forEach((p, i) => {
    if (!isStr(p.platform)) err(file, `platforms[${i}] : "platform" requis`);
    if (p.url && !isUrl(p.url)) err(file, `platforms[${i}] : url invalide (${p.url})`);
  });
})();

/* ---- projects.json ---- */
(() => {
  const file = "data/projects.json";
  const d = load(file);
  if (!d) return;
  if (!isArr(d)) return err(file, "doit être une liste JSON");
  const ids = new Set();
  d.forEach((p, i) => {
    requireFields(file, p, ["id", "title", "category", "description"], `projet #${i + 1} : `);
    if (p.id) {
      if (ids.has(p.id)) err(file, `id en double : "${p.id}"`);
      ids.add(p.id);
      if (!/^[a-z0-9-]+$/.test(p.id)) err(file, `id invalide : "${p.id}" (minuscules, chiffres, tirets)`);
    }
    if (!isArr(p.topics) || p.topics.length === 0) err(file, `projet "${p.id}" : "topics" doit être une liste non vide`);
    if (p.url && p.url.trim() && !isUrl(p.url)) err(file, `projet "${p.id}" : url invalide (${p.url})`);
  });
})();

/* ---- blog.json ---- */
(() => {
  const file = "data/blog.json";
  const d = load(file);
  if (!d) return;
  if (!isArr(d)) return err(file, "doit être une liste JSON");
  const ids = new Set();
  d.forEach((p, i) => {
    requireFields(file, p, ["id", "title", "summary", "content"], `write-up #${i + 1} : `);
    if (p.id) {
      if (ids.has(p.id)) err(file, `id en double : "${p.id}"`);
      ids.add(p.id);
      if (!/^[a-z0-9-]+$/.test(p.id)) err(file, `id invalide : "${p.id}"`);
    }
  });
})();

if (errors.length) {
  console.error(`\n✗ Validation des données : ${errors.length} erreur(s)\n`);
  errors.forEach((e) => console.error("  • " + e));
  console.error("");
  process.exit(1);
}
console.log("✓ Validation des données : tous les fichiers JSON sont valides.");
