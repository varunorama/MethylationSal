# MethylationSal

**[Open the axolotl tail regeneration explorer](https://varunorama.github.io/MethylationSal/)**

Explore CpG methylation by genomic position, search WGBS-associated gene lists, and compare RNA-seq contrasts from stage 42 *Ambystoma mexicanum* embryo tails. Hours refer to time after tail amputation. Chapter 5 lists **Varun B. Dwaraka, Jeramiah J. Smith and S. Randal Voss**. [Dissertation and supplementary files](https://uknowledge.uky.edu/biology_etds/81/)

| Assay | Sampling times | Available evidence |
| --- | --- | --- |
| Whole-genome bisulfite sequencing (WGBS) | 0, 6, 12, 24 h | Four AmexG.v6 bigWigs of CpG methylation percentages, chapter figures, and gene lists associated with differentially methylated regions (DMRs) |
| RNA sequencing | 0, 6, 12, 24, 48 h | Log₂ fold changes and FDRs for reported features in two contrast sets |
| Reduced representation bisulfite sequencing (RRBS) | Time points unverified | Section 5.4.2 records sequencing at UC Davis. A separate RRBS results file or accession has yet to be identified for this experiment. |

## Original Kentucky methylome

The University of Kentucky AmexG.v6 track configuration introduces the four bigWigs with the comment **“Unpublished tracks Methylation from Varun”**. Varun B. Dwaraka is first author of the corresponding dissertation chapter. The axolotl genome hub guide identifies these as embryo tail profiles at 0, 6, 12 and 24 hours post-amputation. In the original browser, enable the WGBS tracks in the methylation group. Sal-Site describes the lab’s data-use expectations for unpublished tracks. [Kentucky’s genome browser](https://genome.ucsc.edu/cgi-bin/hgGateway?genome=AmexG.v6&hubUrl=http://ambystoma.uky.edu/hubExamples/hubAssembly/hub_AmexG_v6/hub.txt) · [Sal-Site genome resources](https://ambystoma.as.uky.edu/genome-resources) · [Original track definitions](https://ambystoma.uky.edu/hubExamples/hubAssembly/hub_AmexG_v6/AmexG_v6.hub_data/trackDb.txt) · [Genome hub guide, p. 9](https://ambystoma.uky.edu/genetic-stock-center/newsletters/Issues-2020-2022/Axolotl_Newsletter_2022.pdf)

| Time | Original CpG percentage track on the Kentucky server | File size |
| --- | --- | ---: |
| 0 h | [Day0 WGBS bigWig](https://ambystoma.uky.edu/hubExamples/hubAssembly/hub_AmexG_v6/AmexG_v6.hub_data/Methylation_bws/Day0_WGBS_CpG_methylation_percent.bed.sorted.bed.bw) | 1.68 GB |
| 6 h | [6hr WGBS bigWig](https://ambystoma.uky.edu/hubExamples/hubAssembly/hub_AmexG_v6/AmexG_v6.hub_data/Methylation_bws/6hr_WGBS_CpG_methylation_percent.bed.sorted.bed.bw) | 1.64 GB |
| 12 h | [12hr WGBS bigWig](https://ambystoma.uky.edu/hubExamples/hubAssembly/hub_AmexG_v6/AmexG_v6.hub_data/Methylation_bws/12hr_WGBS_CpG_methylation_percent.bed.sorted.bed.bw) | 1.63 GB |
| 24 h | [24hr WGBS bigWig](https://ambystoma.uky.edu/hubExamples/hubAssembly/hub_AmexG_v6/AmexG_v6.hub_data/Methylation_bws/24hr_WGBS_CpG_methylation_percent.bed.sorted.bed.bw) | 1.78 GB |

These are processed methylation percentages. Per-CpG methylated and total read counts, the underlying raw-read accession and the full coordinate-level DMR results could not be verified for this time course. The gene lists alone do not identify the position of any individual DMR.

The same hub also lists a **Dwaraka embryo tail RNA** track in TPM. Its expression matrix has 14 sample columns, corresponding to three at 0 h, two at 6 h, and three each at 12, 24 and 48 h. Use the chapter supplement for fold changes and FDRs. [Original Kentucky TPM matrix](https://ambystoma.uky.edu/hubExamples/hubAssembly/hub_AmexG_v6/AmexG_v6.hub_data/RNA_Seq_Rates/dwaraka_tail/tailMatrix_rl) · [Sample-to-time key](https://ambystoma.uky.edu/hubExamples/hubAssembly/hub_AmexG_v6/AmexG_v6.hub_data/RNA_Seq_Rates/dwaraka_tail/tailSamples_rl)

## Using the explorer

- **CpG methylome.** Enter a 1-based, inclusive AmexG.v6 interval of up to 50 kb. The explorer requests all four UKY tracks through the UCSC REST API, joins matching genomic intervals, and exports the full result. Blank cells indicate missing track values. The initial 400-base example is a saved UCSC response. Select **Query region** to fetch it live. The example interval was chosen to demonstrate coverage and has no implied functional annotation. [Explore chr1p:7601–8000](https://varunorama.github.io/MethylationSal/?view=methylome&locus=chr1p%3A7601-8000) · [UCSC REST API](https://genome.ucsc.edu/goldenPath/help/api.html)
- **WGBS associations.** Filter gene-list entries by time, gain or loss of methylation, and direct or inverse relationship to RNA expression. A relationship in the chapter can involve the same or a later expression time point. These are reported directional associations. They provide no causal estimate.
- **RNA expression.** Compare each time point to 0 h, or compare adjacent intervals. The selected end time controls the results-list readout and optional FDR filter. The detail pane shows all four contrasts for the selected feature. TSV exports retain all four contrasts of each matching row at source precision.
- **Study & downloads.** Inspect eight dissertation figures, including the 6, 12, and 24 h integrated heatmaps, or download the original workbook and machine-readable tables.

For example, Table 5.2 lists **SHANK2** under hypermethylated, inverse associations at 6 h. Its matched RNA feature has a log₂ fold change of −0.883 and an FDR of 0.00139 at 12 h versus baseline. The 6 h RNA estimate has an FDR of 0.155. The region’s exact position and methylation magnitude are unavailable in the gene list. [Explore SHANK2](https://varunorama.github.io/MethylationSal/?view=wgbs&q=SHANK2)

## Data and provenance

| File | Source and unit |
| --- | --- |
| [Methylation associations](docs/data/methylation-associations.tsv) | Tables 5.2 and 5.3, printed pp. 134–150. Each of 745 nonempty list cells is one entry; 625 distinct gene labels occur. These counts describe table entries. A single DMR may be associated with multiple genes. |
| [Methylation enzyme expression](docs/data/methylation-enzymes.tsv) | Table 5.1, printed p. 133. Nine gene labels with author-reported fold changes for four baseline contrasts. `NS` retains the source’s significance designation. |
| [RNA against baseline](docs/data/rna-baseline.tsv) | Supplementary File 5.1, worksheet `Regeneration_vs_0`. 13,409 populated rows. Comparisons are 6, 12, 24 and 48 h against 0 h. |
| [Adjacent RNA contrasts](docs/data/rna-adjacent.tsv) | Supplementary File 5.1, worksheet `Adjacent_comparisons`. 8,569 populated rows. Comparisons are 6 vs 0, 12 vs 6, 24 vs 12 and 48 vs 24 h. |
| [Original workbook](source/SupplementaryFile5.1.xlsx) | Unmodified supplementary workbook. SHA-256 `709df1e6a2bc244e2a80517d45247031129bc534b838eeb58850a22b2bbc60fe`. |
| [Chapter figures](docs/figures) | Figures 5.1–5.8, extracted from the deposited dissertation for viewing at its embedded resolution. |

**Methylation fields.** `source_table`, `source_column`, and `data_row` identify the original cell (first gene = row 1 of the list). `gene_label` preserves the spelling. `hour` and `reference_hour` locate the WGBS contrast. `hyper` indicates gain and `hypo` indicates loss. `direct` and `inverse` follow the chapter’s grouping. All labels, duplications and overlapping column memberships were retained, including the overlapping 6 h hypo/direct and 12 h hyper/direct lists in Table 5.3. The column contents were checked against the deposited PDF.

**RNA fields.** `sheet_row` traces the row to the workbook. `feature_id` retains the full identifier, including the AxPQ.v6 model when supplied. `log2FC_12v6`, for example, describes the 12-hour sample relative to 6 hours. The source labels its FDR columns “FDR (log2)”; the cell values are between 0 and 1, and the chapter applies an FDR threshold of 0.05. The explorer preserves those numbers as supplied. Only fold changes are displayed on a log₂ scale. Source `NA` entries and blank cells display as dashes. Exported tables preserve the distinction. Fully blank workbook rows are omitted.

**Identifier matching.** An association label must match a whole identifier or contiguous underscore-delimited components of an RNA identifier, ignoring case. Punctuation, suffixes and model versions are retained. Of 625 labels, 604 match at least one of the 14,395 distinct RNA identifiers, 144 of those match multiple identifiers, and 21 have no match. The explorer lets the reader choose among candidates. Matching a symbol alone cannot pinpoint which genomic region changed or establish which model was intended. Each worksheet retains features selected for that contrast set independently.

## Rebuild

The static explorer runs without a backend. From the repository root, run `python -m http.server 8000 --directory docs` and open `http://localhost:8000`. GitHub Pages serves the same directory.

The checked-in TSVs and figures suffice to serve the site. With Python 3, `openpyxl`, `python-docx`, `Pillow`, and `pypdf` installed, run the builder to regenerate both RNA tables from the included workbook.

```sh
python scripts/build_data.py
```

The optional `--chapter-docx` argument accepts the author’s Chapter 5 Word source for Tables 5.1–5.3. The optional `--dissertation-pdf` argument accepts the full deposited dissertation for Figures 5.1–5.8. Both were used to prepare this edition. [Dissertation record](https://uknowledge.uky.edu/biology_etds/81/)

## Citation

Dwaraka VB. *Comparative Transcriptomic Analysis and Epigenetic Profiling of Salamander Tissue Regeneration*. University of Kentucky, 2021. Chapter 5 and Supplementary File 5.1. Chapter authors listed in the source are Varun B. Dwaraka, Jeramiah J. Smith, and S. Randal Voss. [DOI 10.13023/etd.2021.411](https://doi.org/10.13023/etd.2021.411)
