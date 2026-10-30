import { el, initReveal } from "./site.js";

const err = (msg) => {
  const e = document.getElementById("certs-error");
  if (e) { e.hidden = false; e.textContent = msg; }
};

function certCard(c, state) {
  const pill = state === "ok"
    ? el("span", { class: "pill pill-ok", text: "Obtenu" })
    : el("span", { class: "pill pill-warn", text: "En préparation" });
  return el("article", { class: "item cert", "data-reveal": "" }, [
    el("div", { class: "cert-mark", text: c.mark || "" }),
    el("h3", { text: c.name }),
    c.issuer ? el("p", { style: "color:var(--muted);font-size:var(--step-small);", text: c.issuer }) : null,
    pill,
    c.description ? el("p", { text: c.description }) : null,
  ]);
}

function platformCard(p) {
  return el("a", { class: "link-card", href: p.url, target: "_blank", rel: "noopener", "data-reveal": "" }, [
    el("div", { class: "lc-name", text: p.platform }),
    el("div", { class: "lc-detail", text: p.detail }),
  ]);
}

function block(title, body) {
  return el("section", { class: "block" }, [
    el("div", { class: "wrap" }, [
      el("div", { class: "section-head" }, [el("h2", { text: title, "data-reveal": "" })]),
      body,
    ]),
  ]);
}

fetch("data/certs.json")
  .then((r) => { if (!r.ok) throw new Error(`certs.json (${r.status})`); return r.json(); })
  .then((data) => {
    const mount = document.getElementById("certs-content");
    mount.innerHTML = "";

    if (Array.isArray(data.obtained) && data.obtained.length) {
      mount.append(block("Obtenues",
        el("div", { class: "item-grid" }, data.obtained.map((c) => certCard(c, "ok")))));
    }
    if (Array.isArray(data.in_progress) && data.in_progress.length) {
      mount.append(block("En préparation",
        el("div", { class: "item-grid" }, data.in_progress.map((c) => certCard(c, "warn")))));
    }
    if (Array.isArray(data.platforms) && data.platforms.length) {
      mount.append(block("Plateformes CTF & entraînement",
        el("div", { class: "link-grid" }, data.platforms.map(platformCard))));
    }
    initReveal();
  })
  .catch((e) => err(`Impossible de charger les certifications : ${e.message}`));
