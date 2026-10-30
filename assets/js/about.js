import { el, initReveal } from "./site.js";

const err = (msg) => {
  const e = document.getElementById("about-error");
  if (e) { e.hidden = false; e.textContent = msg; }
};

function timeline(items) {
  return el("div", { class: "timeline" }, (items || []).map((it) =>
    el("div", { class: "tl-item", "data-reveal": "" }, [
      el("div", { class: "tl-date", text: it.period }),
      el("div", {}, [
        el("h3", { class: "tl-title", text: it.title }),
        it.org ? el("div", { class: "tl-org", text: it.org }) : null,
        Array.isArray(it.points) && it.points.length
          ? el("ul", { class: "tl-points" }, it.points.map((p) => el("li", { text: p })))
          : null,
      ]),
    ])
  ));
}

function section(id, title, body) {
  return el("section", { class: "block" }, [
    el("div", { class: "wrap" }, [
      el("div", { class: "section-head" }, [el("h2", { text: title, "data-reveal": "" })]),
      body,
    ]),
  ]);
}

fetch("data/about.json")
  .then((r) => { if (!r.ok) throw new Error(`about.json (${r.status})`); return r.json(); })
  .then((data) => {
    const mount = document.getElementById("about-content");
    mount.innerHTML = "";

    if (data.summary) {
      mount.append(
        el("section", { class: "block" }, [
          el("div", { class: "wrap" }, [
            el("p", { class: "hero-lead", text: data.summary, "data-reveal": "" }),
          ]),
        ])
      );
    }

    mount.append(section("formations", "Formations", timeline(data.formations)));
    mount.append(section("experiences", "Expériences", timeline(data.experiences)));

    if (Array.isArray(data.skills)) {
      const grid = el("div", { class: "skills" }, data.skills.map((g) =>
        el("div", { class: "skill-group", "data-reveal": "" }, [
          el("h3", { text: g.group }),
          el("div", { class: "tags" }, (g.items || []).map((i) => el("span", { class: "tag", text: i }))),
        ])
      ));
      mount.append(section("competences", "Compétences techniques", grid));
    }

    const extras = [];
    if (Array.isArray(data.languages) && data.languages.length) {
      extras.push(el("div", { "data-reveal": "" }, [
        el("h3", { class: "skill-group", text: "Langues", style: "font-size:var(--step-body);margin-bottom:0.6rem;" }),
        el("div", { class: "tags" }, data.languages.map((l) =>
          el("span", { class: "tag", text: `${l.name} — ${l.level}` })
        )),
      ]));
    }
    if (Array.isArray(data.qualities) && data.qualities.length) {
      extras.push(el("div", { "data-reveal": "" }, [
        el("h3", { class: "skill-group", text: "Atouts", style: "font-size:var(--step-body);margin-bottom:0.6rem;" }),
        el("div", { class: "tags" }, data.qualities.map((q) => el("span", { class: "tag", text: q }))),
      ]));
    }
    if (extras.length) {
      mount.append(section("langues", "Langues & atouts", el("div", { class: "skills" }, extras)));
    }
    initReveal();
  })
  .catch((e) => err(`Impossible de charger le profil : ${e.message}`));
