"use strict";
const hubBase = "https://ambystoma.uky.edu/hubExamples/hubAssembly/hub_AmexG_v6/";
const wgbsTracks = [
  {hour:0, prefix:"Day0", gb:"1.68"}, {hour:6, prefix:"6hr", gb:"1.64"},
  {hour:12, prefix:"12hr", gb:"1.63"}, {hour:24, prefix:"24hr", gb:"1.78"}
];
const exampleLocus = "chr1p:7601-8000";
let displayedLocus = "", locusRequest, exportRows = [];

function trackKey(track) { return track.prefix + "_WGBS_CpG_meth"; }
function regionUrl(chrom, start, end) {
  return "https://api.genome.ucsc.edu/getData/track?hubUrl=" + hubBase + "hub.txt;genome=AmexG.v6;track=" +
    wgbsTracks.map(trackKey).join(",") + ";chrom=" + encodeURIComponent(chrom) + ";start=" + (start-1) + ";end=" + end;
}
function initMethylome() {
  for (const track of wgbsTracks) {
    const li = el("li"), link = el("a",track.hour+" h bigWig");
    link.href = hubBase + "AmexG_v6.hub_data/Methylation_bws/" + track.prefix +
      "_WGBS_CpG_methylation_percent.bed.sorted.bed.bw";
    li.append(link,el("span",track.gb+" GB")); $("bigwigs").append(li);
  }
  $("locus-form").onsubmit = event => {event.preventDefault(); queryLocus(false);};
  $("locus-export").onclick = () => tsvExport("AmexG.v6-"+displayedLocus.replace(":","-")+".tsv",
    [["assembly","chrom","start_1based_inclusive","end_1based_inclusive","percent_0h","percent_6h","percent_12h","percent_24h"],...exportRows]);
}
async function queryLocus(useSnapshot) {
  locusRequest?.abort();
  const request = new AbortController();
  locusRequest = request;
  const status = $("locus-status"), source = $("locus-source");
  $("locus-results").hidden = true; source.hidden = true; exportRows = [];
  const input = $("locus").value.trim().replaceAll(",","");
  const match = /^([\w.-]+):(\d+)-(\d+)$/.exec(input);
  const start = Number(match?.[2]), end = Number(match?.[3]);
  if (!match || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end < start || end-start >= 50000) {
    status.textContent = "Enter a region such as chr1p:7601-8000, from 1 to 50,000 bases long.";
    $("locus").focus(); return;
  }
  const chrom = match[1]; displayedLocus = chrom+":"+start+"-"+end; updateUrl();
  const snapshot = useSnapshot && displayedLocus === exampleLocus;
  const url = regionUrl(chrom,start,end);
  source.href = url; source.hidden = false;
  status.textContent = "Loading four WGBS tracks for "+displayedLocus+"…";
  try {
    const response = await fetch(snapshot ? "data/example-chr1p.json" : url,{signal:request.signal});
    if (!response.ok || response.status === 206) throw new Error("Incomplete response");
    const data = await response.json();
    if (request.signal.aborted) return;
    if (data.maxItemsLimit || data.chromSize < end || wgbsTracks.some(track => !Array.isArray(data[trackKey(track)]))) throw new Error("Incomplete interval");
    const intervals = new Map();
    wgbsTracks.forEach((track,i) => {
      for (const {start:from,end:to,value} of data[trackKey(track)]) {
        const key = from+"-"+to;
        if (!intervals.has(key)) intervals.set(key,["AmexG.v6",chrom,from+1,to,"","","",""]);
        intervals.get(key)[4+i] = value;
      }
    });
    exportRows = [...intervals.values()].sort((a,b) => a[2]-b[2] || a[3]-b[3]);
    const saved = snapshot ? " Saved example from the Kentucky tracks. Use Query region to refresh." : " Retrieved from the Kentucky tracks via UCSC.";
    const count = exportRows.length.toLocaleString()+(exportRows.length === 1 ? " distinct track interval." : " distinct track intervals.");
    status.textContent = exportRows.length ? displayedLocus+" · "+count+saved :
      "No CpG percentage was reported by any track in "+displayedLocus+".";
    const rows = document.createDocumentFragment();
    for (const row of exportRows.slice(0,200)) {
      const tr = el("tr"), position = row[2] === row[3] ? row[2] : row[2]+"–"+row[3];
      tr.append(el("td",chrom+":"+position));
      for (const value of row.slice(4)) {
        const td = el("td",value === "" ? "—" : String(value));
        if (value !== "") td.style.backgroundColor = "rgba(40,151,125,"+(0.06+0.29*value/100)+")";
        tr.append(td);
      }
      rows.append(tr);
    }
    $("locus-rows").replaceChildren(rows);
    if (exportRows.length > 200) status.textContent += " Showing the first 200 intervals. Export for the complete result.";
    $("locus-results").hidden = !exportRows.length;
  } catch (error) {
    if (request.signal.aborted) return;
    status.textContent = "Could not retrieve the complete interval. Check the AmexG.v6 chromosome and bounds, or open the UCSC API link for its response.";
  }
}
