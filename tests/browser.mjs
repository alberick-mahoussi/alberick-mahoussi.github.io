#!/usr/bin/env node
/* Browser smoke tests with Playwright.
   Serves the repo over HTTP, loads each page in Chromium and checks that the
   JSON-driven content renders and that no uncaught JS error is thrown.
   Set PW_CHANNEL=chrome to reuse a system Chrome instead of Playwright's Chromium. */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, normalize, extname } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
};

function startServer() {
  const server = createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (p.endsWith("/")) p += "index.html";
      const file = normalize(join(root, p));
      if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
      const body = await readFile(file);
      res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404, { "content-type": "text/plain" }).end("404");
    }
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

async function loadPlaywright() {
  try {
    return (await import("playwright")).chromium;
  } catch {
    console.error("✗ Playwright n'est pas installé. Lance : npm install && npx playwright install chromium");
    process.exit(2);
  }
}

const results = [];
const fail = (name, msg) => results.push({ name, ok: false, msg });
const pass = (name) => results.push({ name, ok: true });

async function check(page, base, name, path, assertions) {
  const jsErrors = [];
  page.on("pageerror", (e) => jsErrors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/i.test(m.text())) jsErrors.push(m.text()); });
  try {
    const resp = await page.goto(base + path, { waitUntil: "domcontentloaded", timeout: 15000 });
    if (!resp || !resp.ok()) throw new Error(`statut HTTP ${resp && resp.status()}`);
    await assertions(page);
    if (jsErrors.length) throw new Error("erreur JS : " + jsErrors[0]);
    pass(name);
  } catch (e) {
    fail(name, e.message);
  } finally {
    page.removeAllListeners("pageerror");
    page.removeAllListeners("console");
  }
}

const count = async (page, sel) => page.$$eval(sel, (els) => els.length);

(async () => {
  const server = await startServer();
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}/`;
  const chromium = await loadPlaywright();
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
  const page = await browser.newPage();

  await check(page, base, "accueil : hero + stats + nav", "index.html", async (p) => {
    await p.waitForSelector("#stats .stat", { timeout: 10000 });
    if ((await count(p, "#stats .stat")) < 1) throw new Error("aucune statistique rendue");
    await p.waitForSelector(".nav-links a", { timeout: 10000 });
    if ((await count(p, ".nav-links a")) < 5) throw new Error("navigation non construite");
    await p.waitForSelector(".footer-name", { timeout: 10000 });
  });

  await check(page, base, "profil : timeline rendue", "about.html", async (p) => {
    await p.waitForSelector(".timeline .tl-item", { timeout: 10000 });
    if ((await count(p, ".timeline .tl-item")) < 2) throw new Error("timeline incomplète");
    await p.waitForSelector(".skills .skill-group", { timeout: 10000 });
  });

  await check(page, base, "projets : cartes + filtres", "projects.html", async (p) => {
    await p.waitForSelector("#project-grid .item", { timeout: 10000 });
    if ((await count(p, "#project-grid .item")) < 3) throw new Error("projets non rendus");
    if ((await count(p, "#filters .chip")) < 2) throw new Error("filtres non construits");
  });

  await check(page, base, "blog : liste des write-ups", "blog.html", async (p) => {
    await p.waitForSelector("#blog-grid .item", { timeout: 10000 });
    if ((await count(p, "#blog-grid .item")) < 1) throw new Error("aucun write-up listé");
  });

  await check(page, base, "blog : rendu Markdown d'un article", "blog.html?article=cyberlab-n0s4n1ty1", async (p) => {
    await p.waitForSelector(".prose", { timeout: 10000 });
    const txt = await p.$eval(".prose", (e) => e.textContent.trim());
    if (txt.length < 50) throw new Error("contenu de l'article vide");
    if ((await count(p, ".prose pre")) < 1) throw new Error("bloc de code non rendu (Markdown)");
  });

  await check(page, base, "certifications : cartes rendues", "certs.html", async (p) => {
    await p.waitForSelector("#certs-content .cert", { timeout: 10000 });
    if ((await count(p, "#certs-content .cert")) < 1) throw new Error("certifications non rendues");
  });

  await check(page, base, "contact : liens rendus", "contact.html", async (p) => {
    await p.waitForSelector("#contact-content .link-card", { timeout: 10000 });
    if ((await count(p, "#contact-content .link-card")) < 1) throw new Error("liens de contact non rendus");
  });

  await check(page, base, "thème sombre : bascule mémorisée", "index.html", async (p) => {
    await p.waitForSelector(".theme-toggle", { timeout: 10000 });
    await p.click(".theme-toggle");
    const theme = await p.getAttribute("html", "data-theme");
    if (theme !== "dark") throw new Error("le thème n'est pas passé en sombre");
  });

  await browser.close();
  server.close();

  const failed = results.filter((r) => !r.ok);
  console.log("");
  results.forEach((r) => console.log(`  ${r.ok ? "✓" : "✗"} ${r.name}${r.ok ? "" : " — " + r.msg}`));
  console.log("");
  if (failed.length) {
    console.error(`✗ Tests navigateur : ${failed.length}/${results.length} en échec.`);
    process.exit(1);
  }
  console.log(`✓ Tests navigateur : ${results.length}/${results.length} réussis.`);
})().catch((e) => { console.error(e); process.exit(1); });
