"use strict";
const $ = id => document.getElementById(id);
const hours = [6, 12, 24, 48];
const figureTitles = ["Cytosine methylation by context", "CpG methylation by genomic feature",
  "Methylation and ChIP-seq signal near transcription start sites", "Differential expression across time",
  "Counts of differentially methylated regions", "DMR–expression associations at 6 h",
  "DMR–expression associations at 12 h", "DMR–expression associations at 24 h"];
const datasets = {}, models = new Map(), labelModels = new Map(), modelLabels = new Map();
const views = ["methylome","wgbs","rna","study"];
let view = "methylome", page = 0, selected = 0, matches = [], ready = false;
const size = 8;
function el(tag, text, cls) {
  const item = document.createElement(tag);
  if (text !== null && text !== undefined) item.textContent = text;
  if (cls) item.className = cls;
  return item;
}
function tsvExport(filename, rows) {
  const blob = new Blob([rows.map(row => row.join("\t")).join("\n") + "\n"], {type:"text/tab-separated-values;charset=utf-8"});
  const link = el("a"); link.href = URL.createObjectURL(blob); link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
async function loadTable(path) {
  const response = await fetch("data/" + path + ".tsv");
  if (!response.ok) throw new Error("Could not load " + path);
  const lines = (await response.text()).replace(/[\r\n]+$/, "").split(/\r?\n/);
  const header = lines.shift().split("\t");
  return {header, rows:lines.map(line => line.split("\t"))};
}
function indexSources() {
  for (const row of datasets.wgbs.rows) labelModels.set(row[3].toUpperCase(), new Set());
  for (const family of ["baseline","adjacent"]) {
    for (const row of datasets[family].rows) {
      if (!models.has(row[1])) models.set(row[1], {});
      models.get(row[1])[family] = row;
    }
  }
  // Keep contiguous identifier components intact, including multi-part source labels.
  for (const id of models.keys()) {
    const tokens = id.toUpperCase().split("_"), labels = new Set();
    for (let i = 0; i < tokens.length; i++) {
      for (let j = i + 1; j <= tokens.length; j++) {
        const label = tokens.slice(i, j).join("_");
        if (labelModels.has(label)) { labels.add(label); labelModels.get(label).add(id); }
      }
    }
    modelLabels.set(id, labels);
  }
}
function updateUrl() {
  const p = new URLSearchParams({view});
  if (view === "methylome" && displayedLocus) p.set("locus",displayedLocus);
  if (view === "wgbs" || view === "rna") {
    if ($("q").value.trim()) p.set("q", $("q").value.trim());
    const keys = view === "wgbs" ? ["time","direction","relation"] : ["family","hour","significance"];
    for (const id of keys) if ($(id).value) p.set(id,$(id).value);
    if (selected > 0) p.set("row",selected+1);
  }
  const url = new URL(location.href); url.search = p; history.replaceState(null,"",url);
}
function setView(next, keepPosition = false) {
  view = next;
  for (const key of views) $("tab-"+key).setAttribute("aria-pressed",String(key === view));
  const tables = view === "wgbs" || view === "rna";
  $("explorer").hidden = !tables; $("study").hidden = view !== "study"; $("methylome").hidden = view !== "methylome";
  for (const key of ["wgbs","rna"]) document.querySelectorAll("."+key).forEach(n => n.hidden = key !== view);
  if (view === "methylome" && !displayedLocus) queryLocus(true);
  else if (ready && tables) search(keepPosition);
  else updateUrl();
}
function number(value) { return value === "" || value === "NA" || value == null ? null : Number(value); }
function fc(value) { const n = number(value); return n == null ? "—" : (n > 0 ? "+" : "") + n.toFixed(3); }
function fdr(value) {
  const n = number(value);
  return n == null ? "—" : n > 0 && n < 0.001 ? n.toExponential(2) : n === 0 ? "0" : String(+n.toPrecision(3));
}
function sourceForView() { return view === "wgbs" ? datasets.wgbs : datasets[$("family").value]; }
function search(keepPosition = false) {
  if (!ready || (view !== "wgbs" && view !== "rna")) return;
  const q = $("q").value.trim().toUpperCase(), data = sourceForView();
  if (view === "wgbs") {
    matches = data.rows.filter(r => {
      if ($("time").value && r[4] !== $("time").value || $("direction").value && r[6] !== $("direction").value ||
          $("relation").value && r[7] !== $("relation").value) return false;
      const label = r[3].toUpperCase();
      return !q || label.includes(q) || [...labelModels.get(label)].some(id => id.toUpperCase().includes(q));
    });
  } else {
    const col = 6 + hours.indexOf(Number($("hour").value));
    matches = data.rows.filter(r => {
      const prob = number(r[col]);
      return r[1].toUpperCase().includes(q) && (!$("significance").value || (prob !== null && prob < 0.05));
    });
  }
  selected = keepPosition ? Math.min(selected, Math.max(0, matches.length-1)) : 0;
  page = Math.floor(selected / size);
  render();
}
function appendChip(parent, value, cls = "") { parent.append(el("span",value,"chip "+cls)); }
function expressionTable(id, family) {
  const container = el("div"), row = models.get(id)?.[family];
  if (!row) { container.append(el("p","This model has no row in the selected worksheet.","note")); return container; }
  const table = el("table",null,"readout"), head = table.createTHead().insertRow();
  for (const h of ["Contrast","log₂ FC","Direction","FDR"]) head.append(el("th",h));
  const body = table.createTBody();
  const max = Math.max(1,...row.slice(2,6).map(v => Math.abs(number(v) ?? 0)));
  hours.forEach((h,i) => {
    const reference = family === "baseline" || i === 0 ? 0 : hours[i-1];
    const tr = body.insertRow(), n = number(row[2+i]);
    tr.append(el("td",h+" vs "+reference+" h"),el("td",fc(row[2+i])));
    const chart = el("td"), track = el("span",null,"track"); track.setAttribute("aria-hidden","true");
    if (n !== null) {
      const bar = el("span",null,n >= 0 ? "pos" : "neg"), width = Math.abs(n) / max * 50;
      bar.style.left = (n >= 0 ? 50 : 50-width) + "%"; bar.style.width = width+"%"; track.append(bar);
    }
    chart.append(track); tr.append(chart,el("td",fdr(row[6+i])));
  });
  container.append(table, el("p",(family === "baseline" ? "Regeneration_vs_0" : "Adjacent_comparisons")+
    " · File 5.1, worksheet row "+row[0]+". Dashes mark missing source values.","note"));
  return container;
}
function showModels(card, ids, defaultFamily) {
  if (!ids.length) { card.append(el("p","No exact identifier-component match in either RNA worksheet.","note")); return; }
  let id = ids[0], family = defaultFamily;
  const readout = el("div"), actions = el("div",null,"examples");
  if (ids.length > 1) {
    const label = el("label",ids.length+" candidate RNA identifiers match this label. Choose a model.","pickmodel");
    const select = el("select"); ids.forEach(x => select.append(new Option(x,x)));
    select.onchange = () => {id = select.value; draw();}; label.append(select); card.append(label);
  }
  const modelName = el("p",null,"id");
  for (const [key,title] of [["baseline","Against baseline"],["adjacent","Adjacent intervals"]]) {
    const button = el("button",title); button.value = key;
    button.onclick = () => {family = key; draw();}; actions.append(button);
  }
  function draw() {
    modelName.textContent = id;
    for (const btn of actions.children) {btn.disabled = btn.value === family; btn.setAttribute("aria-pressed",String(btn.disabled));}
    readout.replaceChildren(expressionTable(id,family));
  }
  card.append(modelName,actions,readout); draw();
}
function renderDetail() {
  const card = $("detail"); card.replaceChildren();
  if (!matches.length) {card.append(el("h2","No matching records"),el("p","Try another identifier or clear the filters.","note")); return;}
  const r = matches[selected];
  if (view === "wgbs") {
    card.append(el("h2",r[3]),el("p","Chapter 5 · Table "+r[0]+" · gene list entry "+r[2],"note"));
    const chips = el("div",null,"evidence");
    appendChip(chips,r[4]+" h vs 0 h"); appendChip(chips,r[6] === "hyper" ? "Hypermethylated" : "Hypomethylated",r[6]);
    appendChip(chips,r[7] === "direct" ? "Direct relationship" : "Inverse relationship");
    card.append(chips,el("p","The chapter associates a region that "+(r[6] === "hyper" ? "gained" : "lost")+
      " methylation with a gene whose expression changed in the "+(r[7] === "direct" ? "same" : "opposite")+
      " direction at the same or a subsequent sampled time."));
    card.append(el("h3","RNA expression"));
    showModels(card,[...labelModels.get(r[3].toUpperCase())],"baseline");
  } else {
    card.append(el("h2","RNA expression"));
    showModels(card,[r[1]],$("family").value);
    card.append(el("h3","WGBS gene-list evidence"));
    const labels = modelLabels.get(r[1]), links = datasets.wgbs.rows.filter(s => labels.has(s[3].toUpperCase()));
    if (!links.length) card.append(el("p","No matching label in Tables 5.2–5.3. Genome-wide methylation status is unknown for this entry.","note"));
    for (const link of links) card.append(el("p",link[3]+" · "+link[4]+" vs 0 h · "+link[6]+"methylated · "+link[7]+" · Table "+link[0]+", entry "+link[2],"note"));
  }
}
function render() {
  const totalPages = Math.ceil(matches.length/size);
  $("workspace").hidden = false; $("load").hidden = true;
  $("count").textContent = matches.length.toLocaleString()+" "+(view === "wgbs" ? "list entries" : "RNA records");
  const rows = $("rows"); rows.replaceChildren();
  matches.slice(page*size,(page+1)*size).forEach((r,i) => {
    const index = page*size+i, button = el("button",null,"hit");
    button.setAttribute("aria-pressed",String(index === selected));
    const t = hours.indexOf(Number($("hour").value));
    button.append(el("strong",view === "wgbs" ? r[3] : r[1]),
      el("small",view === "wgbs" ? r[4]+" h · "+r[6]+"methylated · "+r[7] :
        $("hour").value+" h · log₂ FC "+fc(r[2+t])+" · FDR "+fdr(r[6+t])));
    button.onclick = () => {selected = index; render();}; rows.append(button);
  });
  $("pager").hidden = totalPages < 2; $("prev").disabled = page === 0; $("next").disabled = page+1 >= totalPages;
  $("page").textContent = (page+1)+" / "+totalPages; $("download").disabled = !matches.length;
  renderDetail(); updateUrl();
}
function clearFilters() {
  for (const key of ["time","direction","relation","family","hour","significance"]) $(key).selectedIndex = 0;
  $("q").value = "";
}
$("search").onsubmit = event => {event.preventDefault(); search();};
$("search").querySelectorAll("select").forEach(s => s.onchange = () => search());
$("clear").onclick = () => {clearFilters();search();};
document.querySelectorAll("[data-gene]").forEach(b => b.onclick = () => {clearFilters(); $("q").value = b.dataset.gene; search();});
for (const key of views) $("tab-"+key).onclick = () => setView(key);
for (const [key,step] of [["prev",-1],["next",1]]) $(key).onclick = () => {page += step; selected = page*size; render();};
$("download").onclick = () => tsvExport("MethylationSal-"+(view === "wgbs" ? "wgbs-associations" : "rna-"+$("family").value)+".tsv",[sourceForView().header,...matches]);
figureTitles.forEach((title,i) => {
  const link = el("a"), img = el("img"); link.href = "figures/figure-5-"+(i+1)+".png";
  img.loading = "lazy"; img.src = link.href; img.alt = ""; link.append(img,el("strong","Figure 5."+(i+1)),el("span",title)); $("figures").append(link);
});
async function init() {
  const params = new URLSearchParams(location.search);
  initMethylome();
  $("locus").value = params.get("locus")?.slice(0,100) || exampleLocus;
  $("q").value = (params.get("q") || "").slice(0,180);
  for (const key of ["time","direction","relation","family","hour","significance"]) {
    if ([...$(key).options].some(o => o.value === params.get(key))) $(key).value = params.get(key);
  }
  selected = Math.max(0,(Number.parseInt(params.get("row"),10)||1)-1);
  setView(views.includes(params.get("view")) ? params.get("view") : params.has("q") ? "wgbs" : "methylome",true);
  [datasets.wgbs,datasets.baseline,datasets.adjacent] = await Promise.all(
    ["methylation-associations","rna-baseline","rna-adjacent"].map(loadTable));
  indexSources(); ready = true; setView(view,true);
}
init().catch(() => {$("load").hidden = false; $("load").textContent = "The tables could not load. Reload the page or download them from Study & downloads.";});
