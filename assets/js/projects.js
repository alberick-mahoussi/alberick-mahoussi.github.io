import { el, initReveal } from "./site.js";

const grid = document.getElementById("project-grid");
const filtersEl = document.getElementById("filters");
const emptyEl = document.getElementById("empty-msg");
const errorEl = document.getElementById("project-error");

const TOPIC_LABELS = {
  defense: "Défense / Blue Team",
  offensive: "Offensive / Pentest",
  grc: "Audit & GRC",
  systemes: "Systèmes",
  lab: "Labs",
  outils: "Outillage",
};

function applyFilter(topic) {
  let visible = 0;
  grid.querySelectorAll(".item").forEach((card) => {
    const match = topic === "all" || (card.dataset.topics || "").split(" ").includes(topic);
    card.hidden = !match;
    if (match) visible++;
  });
  emptyEl.hidden = visible > 0;
}

function renderFilters(projects) {
  const topics = [...new Set(projects.flatMap((p) => p.topics || []))]
    .sort((a, b) => (TOPIC_LABELS[a] || a).localeCompare(TOPIC_LABELS[b] || b, "fr"));
  filtersEl.innerHTML = "";

  const all = el("button", { type: "button", class: "chip active", "data-filter": "all", "aria-pressed": "true" }, [
    "Tous ", el("span", { class: "count", text: `(${projects.length})` }),
  ]);
  filtersEl.append(all);

  topics.forEach((t) => {
    filtersEl.append(el("button", {
      type: "button", class: "chip", "data-filter": t, "aria-pressed": "false",
      text: TOPIC_LABELS[t] || t,
    }));
  });

  filtersEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-filter]");
    if (!btn) return;
    filtersEl.querySelectorAll(".chip").forEach((c) => { c.classList.remove("active"); c.setAttribute("aria-pressed", "false"); });
    btn.classList.add("active");
    btn.setAttribute("aria-pressed", "true");
    applyFilter(btn.dataset.filter);
  });
}

function renderProjects(projects) {
  grid.innerHTML = "";
  projects.forEach((p) => {
    const url = typeof p.url === "string" ? p.url.trim() : "";
    const valid = /^https?:\/\/\S+$/i.test(url);
    const foot = el("div", { class: "foot" }, [
      el("div", { class: "tags" }, (p.technologies || []).map((t) => el("span", { class: "tag", text: t }))),
      valid ? el("a", { class: "repo-link", href: url, target: "_blank", rel: "noopener noreferrer", text: "Voir le dépôt ↗" }) : null,
    ]);
    grid.append(
      el("article", { class: "item", "data-topics": (p.topics || []).join(" "), "data-reveal": "" }, [
        el("p", { class: "cat", text: p.category }),
        el("h3", { text: p.title }),
        el("p", { text: p.description }),
        foot,
      ])
    );
  });
  applyFilter("all");
}

fetch("data/projects.json")
  .then((r) => { if (!r.ok) throw new Error(`Chargement impossible (${r.status})`); return r.json(); })
  .then((projects) => {
    if (!Array.isArray(projects)) throw new Error("Le fichier des projets doit contenir une liste JSON.");
    renderProjects(projects);
    renderFilters(projects);
    initReveal();
  })
  .catch((e) => {
    errorEl.hidden = false;
    errorEl.textContent = `Impossible de charger les projets : ${e.message}`;
    emptyEl.hidden = true;
  });
