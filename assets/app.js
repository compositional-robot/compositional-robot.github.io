// Renders the workshops, paper list and background from the data files in the
// awesome-compositional-robot-learning repository, which GitHub Pages serves on
// this same domain. All text goes through textContent, and only http(s) links
// and local thumbnails are rendered, because entries arrive through pull requests.

const DATA = "/awesome-compositional-robot-learning/";
const REPO = "https://github.com/compositional-robot/awesome-compositional-robot-learning";

// Keep in sync with scripts/validate.py and scripts/build_readme.py in the data repo.
const TOPICS = [
  { id: "time", label: "Composing skills over time" },
  { id: "modality", label: "Composing modalities & policies" },
  { id: "constraints", label: "Composing constraints & objectives" },
  { id: "programs", label: "Programs & symbolic structure" },
  { id: "modular", label: "Modular architectures" },
  { id: "benchmarks", label: "Benchmarks & analysis" },
];
const LINKS = [["paper", "Paper"], ["project", "Project"], ["code", "Code"]];

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const safeUrl = (u) => (typeof u === "string" && /^https?:\/\//i.test(u) ? u : null);
const safeImage = (u) =>
  typeof u === "string" && /^images\/papers\/[\w.-]+\.(jpe?g|png|webp|gif)$/i.test(u) ? DATA + u : null;
const topicOf = (id) => TOPICS.find((t) => t.id === id);
const byRecency = (a, b) => b.year - a.year || a.title.localeCompare(b.title);

let papers = [];
let active = "all";

async function load(name) {
  const res = await fetch(DATA + "data/" + name);
  if (!res.ok) throw new Error(`${name}: ${res.status}`);
  return res.json();
}

function linkOrText(cls, text, href) {
  const node = el("div", cls);
  if (href) {
    const a = el("a", null, text);
    a.href = href;
    node.append(a);
  } else {
    node.textContent = text;
  }
  return node;
}

function metaNode(p) {
  const meta = el("p", "paper-meta");
  meta.append(el("em", null, p.venue));
  for (const [key, label] of LINKS) {
    const u = safeUrl(p[key]);
    if (!u) continue;
    const a = el("a", null, `[${label}]`);
    a.href = u;
    a.setAttribute("aria-label", `${label}: ${p.title}`);
    meta.append(" ", a);
  }
  return meta;
}

function thumbNode(p, href) {
  const box = el(href ? "a" : "div", "thumb");
  if (href) {
    box.href = href;
    box.tabIndex = -1;
    box.setAttribute("aria-hidden", "true");
  }
  const src = safeImage(p.image);
  if (src) {
    const img = el("img");
    img.src = src;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    box.append(img);
  } else {
    box.classList.add("empty");
  }
  return box;
}

function paperNode(p) {
  const li = el("li", "paper has-thumb");
  const body = el("div", "paper-body");
  const href = safeUrl(p.project) || safeUrl(p.paper);
  li.append(thumbNode(p, href), body);

  body.append(linkOrText("paper-title", p.title, href), el("p", "paper-authors", p.authors));
  const meta = metaNode(p);
  const labels = (p.topics || []).map(topicOf).filter(Boolean).map((t) => t.label);
  if (labels.length) meta.append(el("span", "topic", labels.join(" · ")));
  body.append(meta);
  if (p.note) body.append(el("p", "paper-note", p.note));
  return li;
}

function backgroundNode(p) {
  const li = el("li", "paper");
  li.append(linkOrText("paper-title", p.title, safeUrl(p.paper)), el("p", "paper-authors", p.authors), metaNode(p));
  if (p.note) li.append(el("p", "paper-note", p.note));
  return li;
}

function workshopNode(w) {
  const li = el("li");
  const title = el("a");
  title.href = safeUrl(w.url) || "#";
  title.append(el("strong", null, w.title));
  const d = new Date(w.date + "T12:00:00");
  const when = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const line = el("span");
  line.append(el("em", null, w.venue), `, ${when}, ${w.location}`);
  li.append(
    title, el("br"),
    line, el("br"),
    `Organizers: ${(w.organizers || []).join(", ")}`, el("br"),
    el("span", "muted", `Speakers: ${(w.speakers || []).join(", ")}`),
  );
  return li;
}

function render() {
  const q = $("q").value.trim().toLowerCase();
  const shown = papers.filter((p) => {
    if (active !== "all" && !(p.topics || []).includes(active)) return false;
    if (!q) return true;
    return [p.title, p.authors, p.venue, p.note].join(" ").toLowerCase().includes(q);
  });
  $("list").replaceChildren(...shown.map(paperNode));
  $("empty").hidden = shown.length > 0;
  $("count").textContent =
    shown.length === papers.length ? `${papers.length} papers` : `${shown.length} of ${papers.length} papers`;
  for (const b of $("chips").querySelectorAll("button")) {
    b.setAttribute("aria-pressed", String(b.dataset.topic === active));
  }
}

function buildChips() {
  const make = (id, label, n) => {
    const b = el("button", null, `${label} (${n})`);
    b.type = "button";
    b.dataset.topic = id;
    b.addEventListener("click", () => {
      active = id;
      render();
    });
    return b;
  };
  const nodes = [make("all", "All", papers.length)];
  for (const t of TOPICS) {
    const n = papers.filter((p) => (p.topics || []).includes(t.id)).length;
    if (n) nodes.push(make(t.id, t.label, n));
  }
  $("chips").replaceChildren(...nodes);
}

function loadError(target, name) {
  const msg = el("p", "muted", "Could not load this list. ");
  const a = el("a", null, "See it on GitHub");
  a.href = REPO;
  msg.append(a);
  target.replaceWith(msg);
  console.error("Failed to load", name);
}

async function init() {
  const [p, w, b] = await Promise.allSettled([load("papers.json"), load("workshops.json"), load("background.json")]);

  if (w.status === "fulfilled") {
    $("workshop-list").replaceChildren(...w.value.sort((x, y) => y.date.localeCompare(x.date)).map(workshopNode));
  } else loadError($("workshop-list"), "workshops.json");

  if (b.status === "fulfilled") {
    $("background-list").replaceChildren(...b.value.sort((x, y) => x.year - y.year).map(backgroundNode));
  } else loadError($("background-list"), "background.json");

  if (p.status !== "fulfilled") {
    $("count").textContent = "";
    loadError($("list"), "papers.json");
    return;
  }
  papers = p.value.sort(byRecency);
  buildChips();
  $("q").addEventListener("input", render);
  $("reset").addEventListener("click", () => {
    active = "all";
    $("q").value = "";
    render();
  });
  render();
}

init();
