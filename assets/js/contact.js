import { getSite, el, initReveal } from "./site.js";

const err = (msg) => {
  const e = document.getElementById("contact-error");
  if (e) { e.hidden = false; e.textContent = msg; }
};

function block(title, body) {
  return el("section", { class: "block" }, [
    el("div", { class: "wrap" }, [
      el("div", { class: "section-head" }, [el("h2", { text: title, "data-reveal": "" })]),
      body,
    ]),
  ]);
}

function linkCard(name, detail, href, external) {
  const attrs = { class: "link-card", href, "data-reveal": "" };
  if (external) { attrs.target = "_blank"; attrs.rel = "noopener"; }
  return el("a", attrs, [
    el("div", { class: "lc-name", text: name }),
    el("div", { class: "lc-detail", text: detail }),
  ]);
}

getSite().then((site) => {
  if (!site) return err("Impossible de charger les informations de contact.");
  const mount = document.getElementById("contact-content");
  mount.innerHTML = "";
  const links = site.links || {};

  // target card
  if (site.target) {
    const t = site.target;
    const dl = el("dl", { class: "target-grid" });
    [["Contrat recherché", t.contract], ["Postes", t.roles], ["Localisation", t.location], ["Disponibilité", t.availability]]
      .forEach(([k, v]) => { if (v) dl.append(el("dt", { text: k }), el("dd", { text: v })); });
    mount.append(el("section", { class: "block" }, [
      el("div", { class: "wrap" }, [
        el("div", { class: "target", "data-reveal": "" }, [
          el("h2", { text: "Recherche en cours" }),
          t.note ? el("p", { class: "target-note", text: t.note }) : null,
          dl,
        ]),
      ]),
    ]));
  }

  // direct contact
  const direct = [];
  if (links.email) direct.push(linkCard("Email", links.email, `mailto:${links.email}`, false));
  if (links.linkedin) direct.push(linkCard("LinkedIn", "alberick-mahoussi", links.linkedin, true));
  if (links.github) direct.push(linkCard("GitHub", "alberick-mahoussi", links.github, true));
  if (direct.length) mount.append(block("Contact direct", el("div", { class: "link-grid" }, direct)));

  // CTF platforms
  if (Array.isArray(site.ctf) && site.ctf.length) {
    mount.append(block("Plateformes CTF",
      el("div", { class: "link-grid" }, site.ctf.map((p) =>
        linkCard(p.platform, `${p.handle} · ${p.detail}`, p.url, true)))));
  }

  // CV
  if (links.cv) {
    mount.append(el("section", { class: "block" }, [
      el("div", { class: "wrap" }, [
        el("div", { class: "section-head" }, [el("h2", { text: "Curriculum Vitae", "data-reveal": "" })]),
        el("a", { class: "btn btn-primary", href: links.cv, target: "_blank", rel: "noopener", "data-reveal": "",
          html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Télécharger le CV (PDF)' }),
      ]),
    ]));
  }
  initReveal();
}).catch((e) => err(`Impossible de charger le contact : ${e.message}`));
