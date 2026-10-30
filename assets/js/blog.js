import { el, initReveal } from "./site.js";

const listEl = document.getElementById("blog-list");
const gridEl = document.getElementById("blog-grid");
const emptyEl = document.getElementById("blog-empty");
const articleEl = document.getElementById("article-view");
const headerEl = document.getElementById("blog-header");
const errorEl = document.getElementById("blog-error");

const hasMarked = typeof window.marked !== "undefined";
const hasPurify = typeof window.DOMPurify !== "undefined";

if (hasMarked) {
  window.marked.setOptions({ gfm: true, breaks: true, headerIds: false, mangle: false });
}

function renderMarkdown(md) {
  const raw = hasMarked ? window.marked.parse(md || "") : escapeHtml(md || "");
  return hasPurify ? window.DOMPurify.sanitize(raw) : raw;
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function topicTags(topics) {
  if (!Array.isArray(topics) || !topics.length) return null;
  return el("div", { class: "tags" }, topics.map((t) => el("span", { class: "tag", text: t })));
}

function renderList(posts) {
  if (!posts.length) {
    emptyEl.hidden = false;
    gridEl.hidden = true;
    return;
  }
  emptyEl.hidden = true;
  gridEl.hidden = false;
  gridEl.innerHTML = "";
  posts.forEach((p) => {
    gridEl.append(
      el("a", { class: "item", href: `blog.html?article=${encodeURIComponent(p.id)}`, "data-reveal": "", style: "text-decoration:none;" }, [
        p.date ? el("div", { class: "article-date", text: p.date }) : null,
        el("h3", { text: p.title }),
        p.summary ? el("p", { text: p.summary }) : null,
        topicTags(p.topics),
      ])
    );
  });
}

function renderArticle(post) {
  if (headerEl) headerEl.hidden = true;
  listEl.hidden = true;
  articleEl.hidden = false;
  articleEl.innerHTML = "";

  const meta = el("div", { class: "article-meta" }, [
    el("a", { class: "back", href: "blog.html", text: "← Tous les write-ups" }),
    post.date ? el("span", { class: "article-date", text: post.date }) : null,
  ]);
  const prose = el("div", { class: "prose" });
  prose.innerHTML = renderMarkdown(post.content);

  articleEl.append(
    meta,
    el("h1", { style: "font-size:var(--step-head);letter-spacing:-0.03em;margin-bottom:0.75rem;", text: post.title }),
    topicTags(post.topics) || document.createComment("no-topics"),
    el("div", { style: "margin-top:1.5rem;" }, [prose])
  );
  document.title = `${post.title} — Alberick Mahoussi`;
}

fetch("data/blog.json")
  .then((r) => { if (!r.ok) throw new Error(`blog.json (${r.status})`); return r.json(); })
  .then((posts) => {
    if (!Array.isArray(posts)) throw new Error("Le fichier du blog doit contenir une liste JSON.");
    const id = new URLSearchParams(location.search).get("article");
    const post = id ? posts.find((p) => p.id === id) : null;
    if (post) renderArticle(post);
    else renderList(posts);
    initReveal();
  })
  .catch((e) => {
    if (errorEl) { errorEl.hidden = false; errorEl.textContent = `Impossible de charger le blog : ${e.message}`; }
    if (emptyEl) emptyEl.hidden = true;
  });
