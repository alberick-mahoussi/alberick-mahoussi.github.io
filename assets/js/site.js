/* =========================================================
   site.js — shared shell: nav, footer, theme, reveal
   Loaded on every page. No dependencies.
   ========================================================= */

const NAV = [
  { href: "index.html", label: "Accueil" },
  { href: "about.html", label: "Profil" },
  { href: "projects.html", label: "Projets" },
  { href: "blog.html", label: "Blog" },
  { href: "certs.html", label: "Certifications" },
  { href: "contact.html", label: "Contact" },
];

/* ---- shared data (fetched once) ---- */
let sitePromise = null;
export function getSite() {
  if (!sitePromise) {
    sitePromise = fetch("data/site.json")
      .then((r) => {
        if (!r.ok) throw new Error(`site.json (${r.status})`);
        return r.json();
      })
      .catch((err) => {
        console.error("Chargement de site.json impossible :", err);
        return null;
      });
  }
  return sitePromise;
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.append(c.nodeType ? c : document.createTextNode(c));
  }
  return node;
}

/* ---- theme ---- */
const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

function prefersDark() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}
function currentTheme() {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return prefersDark() ? "dark" : "light";
}
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const btn = document.querySelector(".theme-toggle");
  if (btn) {
    btn.innerHTML = theme === "dark" ? SUN : MOON;
    btn.setAttribute("aria-label", theme === "dark" ? "Passer au thème clair" : "Passer au thème sombre");
    btn.setAttribute("aria-pressed", String(theme === "dark"));
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#0f1012" : "#ffffff");
}
function toggleTheme() {
  const next = (document.documentElement.getAttribute("data-theme") || currentTheme()) === "dark" ? "light" : "dark";
  try { localStorage.setItem("theme", next); } catch (_) {}
  applyTheme(next);
}

/* ---- nav / footer ---- */
function buildNav() {
  const mount = document.getElementById("site-nav");
  if (!mount) return;
  const here = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  const links = el("nav", { class: "nav-links", id: "nav-links", "aria-label": "Navigation principale" },
    NAV.map((n) => {
      const active = n.href.toLowerCase() === here || (here === "" && n.href === "index.html");
      return el("a", { href: n.href, text: n.label, ...(active ? { "aria-current": "page" } : {}) });
    })
  );

  const toggle = el("button", { class: "theme-toggle", type: "button" });
  toggle.addEventListener("click", toggleTheme);

  const burger = el("button", {
    class: "nav-burger", type: "button", "aria-label": "Ouvrir le menu", "aria-expanded": "false", "aria-controls": "nav-links",
    html: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  });
  function setMenu(open) {
    if (window.innerWidth > 680) { links.hidden = false; return; }
    links.hidden = !open;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  }
  burger.addEventListener("click", () => setMenu(links.hidden));
  links.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  window.addEventListener("resize", () => { if (window.innerWidth > 680) links.hidden = false; });
  if (window.innerWidth <= 680) links.hidden = true;

  mount.className = "nav";
  mount.innerHTML = "";
  mount.append(
    el("div", { class: "wrap" }, [
      el("div", { class: "nav-inner" }, [
        el("a", { href: "index.html", class: "nav-logo", text: "Alberick Mahoussi" }),
        el("div", { class: "nav-right" }, [links, toggle, burger]),
      ]),
    ])
  );
  applyTheme(document.documentElement.getAttribute("data-theme") || currentTheme());
}

async function buildFooter() {
  const mount = document.getElementById("site-footer");
  if (!mount) return;
  const site = await getSite();
  const name = (site && site.name) || "Alberick Mahoussi";
  const links = (site && site.links) || {};
  const year = new Date().getFullYear();

  const socials = [];
  if (links.github) socials.push(el("a", { href: links.github, target: "_blank", rel: "noopener", text: "GitHub" }));
  if (links.linkedin) socials.push(el("a", { href: links.linkedin, target: "_blank", rel: "noopener", text: "LinkedIn" }));
  if (links.email) socials.push(el("a", { href: `mailto:${links.email}`, text: "Email" }));

  // interleave separators between social links
  const socialRow = [];
  socials.forEach((s, i) => {
    if (i) socialRow.push(el("span", { class: "sep", text: "·" }));
    socialRow.push(s);
  });
  socialRow.push(el("span", { class: "sep", text: "·" }), el("span", { text: `© ${year}` }));

  mount.className = "footer";
  mount.innerHTML = "";
  mount.append(
    el("div", { class: "wrap" }, [
      el("div", { class: "footer-name", text: name }),
      el("div", { class: "footer-row" }, [
        el("div", { class: "footer-links" }, NAV.map((n) => el("a", { href: n.href, text: n.label }))),
        el("div", { class: "footer-note" }, socialRow),
      ]),
    ])
  );
}

/* ---- reveal on scroll (element-based, idempotent, re-callable) ---- */
let revealObserver = null;
export function initReveal(scope = document) {
  const nodes = scope.querySelectorAll("[data-reveal]:not([data-revealed])");
  if (!nodes.length) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) {
    nodes.forEach((n) => { n.setAttribute("data-revealed", ""); n.classList.add("is-in"); });
    return;
  }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); revealObserver.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
  }
  nodes.forEach((n) => { n.setAttribute("data-revealed", ""); revealObserver.observe(n); });
}

/* ---- boot ---- */
// set theme ASAP (before paint handled by inline snippet in <head>; this re-affirms)
applyTheme(currentTheme());
document.addEventListener("DOMContentLoaded", () => {
  buildNav();
  buildFooter();
  initReveal();
});
