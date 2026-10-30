import { getSite, el, initReveal } from "./site.js";

function fillHero(site) {
  const h1 = document.getElementById("hero-title");
  if (h1) {
    h1.innerHTML = "";
    h1.append(
      document.createTextNode(site.statement_line_1 || "Je construis, je casse"),
      el("br"),
      el("span", { class: "accent", text: site.statement_line_2 || "et je sécurise." })
    );
  }
  const lead = document.getElementById("hero-lead");
  if (lead && site.tagline) lead.textContent = site.tagline;
}

function fillStats(site) {
  const mount = document.getElementById("stats");
  if (!mount || !Array.isArray(site.stats)) return;
  mount.innerHTML = "";
  site.stats.forEach((s) => {
    mount.append(
      el("div", { class: "stat" }, [
        el("div", { class: "stat-val", text: s.value }),
        el("div", { class: "stat-label", text: s.label }),
      ])
    );
  });
}

function fillTarget(site) {
  const mount = document.getElementById("target");
  if (!mount || !site.target) return;
  const t = site.target;
  const dl = el("dl", { class: "target-grid" });
  const rows = [
    ["Contrat recherché", t.contract],
    ["Postes", t.roles],
    ["Localisation", t.location],
    ["Disponibilité", t.availability],
  ];
  rows.forEach(([k, v]) => {
    if (!v) return;
    dl.append(el("dt", { text: k }), el("dd", { text: v }));
  });
  mount.innerHTML = "";
  mount.append(
    el("h2", { text: "Recherche en cours" }),
    t.note ? el("p", { class: "target-note", text: t.note }) : null,
    dl
  );
}

getSite().then((site) => {
  if (!site) return; // static HTML fallback stays in place
  fillHero(site);
  fillStats(site);
  fillTarget(site);
  initReveal();
});
