"""Extract Chapter 5 tables and figures. See the repository README for inputs."""

import argparse
import csv
import math
from pathlib import Path

from docx import Document
from openpyxl import load_workbook
from pypdf import PdfReader


def write_tsv(path, header, rows):
    with path.open("w", encoding="utf-8", newline="") as out:
        writer = csv.writer(out, delimiter="\t", lineterminator="\n")
        writer.writerow(header)
        writer.writerows(rows)


def extract_expression(book_path, out):
    book = load_workbook(book_path, read_only=True, data_only=True)
    try:
        for sheet, kind, controls in [
            ("Regeneration_vs_0", "baseline", [0, 0, 0, 0]),
            ("Adjacent_comparisons", "adjacent", [0, 6, 12, 24]),
        ]:
            pairs = [f"{h}v{c}" for h, c in zip([6, 12, 24, 48], controls)]
            values = book[sheet].values
            header = next(values)
            expected = ["trans"] + [f"D{pair}_{metric} (log2)" for metric in ("FC", "FDR") for pair in pairs]
            if list(header) != expected:
                raise ValueError(f"Unexpected column labels in {sheet}")
            records = []
            for index, row in enumerate(values, 2):
                if all(v is None for v in row):
                    continue
                if not row[0]:
                    raise ValueError(f"Missing identifier in {sheet} row {index}")
                for i, value in enumerate(row[1:], 1):
                    if value in (None, "NA"):
                        continue
                    if not isinstance(value, (int, float)) or not math.isfinite(value):
                        raise ValueError(f"Invalid measurement in {sheet} row {index}")
                    if i >= 5 and not 0 <= value <= 1:
                        raise ValueError(f"Invalid FDR in {sheet} row {index}")
                records.append([index, *row])
            fields = ["sheet_row", "feature_id"] + [f"{metric}_{p}" for metric in ("log2FC", "FDR") for p in pairs]
            write_tsv(out / f"rna-{kind}.tsv", fields, records)
            print(sheet, len(records), "expression records")
    finally:
        book.close()


def extract_tables(chapter, out):
    doc = Document(chapter)
    enzyme, inverse, direct = doc.tables
    rows = [[cell.text.strip() for cell in row.cells] for row in enzyme.rows]
    if rows[0] != ["geneID", "6h v 0h", "12h v 0h", "24h v 0h", "48h v 0h"]:
        raise ValueError("Unexpected Table 5.1 header")
    write_tsv(out / "methylation-enzymes.tsv", rows[0], rows[1:])
    entries = []
    for table, relation, number in [(inverse, "inverse", "5.2"), (direct, "direct", "5.3")]:
        columns = list(zip(*[[cell.text.strip() for cell in row.cells] for row in table.rows]))
        for col, column in enumerate(columns):
            hour = [6, 12, 24][col // 2]
            change = ["Hyper", "Hypo"][col % 2]
            if column[0] != f"Hr{hour}_{change}DMRs_{relation}":
                raise ValueError(f"Unexpected source column: {column[0]}")
            for row, gene in enumerate(column[1:], 1):
                if gene:
                    entries.append([number, column[0], row, gene, hour, 0, change.lower(), relation])
    write_tsv(out / "methylation-associations.tsv", ["source_table", "source_column", "data_row",
              "gene_label", "hour", "reference_hour", "methylation", "relationship"], entries)
    print(len(entries), "gene-list entries")


def extract_figures(pdf, destination):
    reader = PdfReader(pdf)
    found = set()
    for page in reader.pages:
        if not page.get("/Resources") or not page["/Resources"].get("/XObject"):
            continue
        caption = " ".join((page.extract_text() or "").split())
        for n in range(1, 9):
            if f"Figure 5.{n}." not in caption or not caption.lstrip("0123456789 ").startswith(f"Figure 5.{n}."):
                continue
            images = list(page.images)
            if len(images) != 1 or n in found:
                raise ValueError(f"Ambiguous source image for Figure 5.{n}")
            images[0].image.save(destination / f"figure-5-{n}.png")
            found.add(n)
    if found != set(range(1, 9)):
        raise ValueError(f"Incomplete figure set: {found}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--chapter-docx", type=Path, help="Author's Chapter5.docx for Tables 5.1–5.3")
    ap.add_argument("--dissertation-pdf", type=Path, help="Deposited dissertation, for Figures 5.1–5.8")
    args = ap.parse_args()
    root = Path(__file__).resolve().parents[1]
    data = root / "docs" / "data"
    extract_expression(root / "source" / "SupplementaryFile5.1.xlsx", data)
    if args.chapter_docx:
        extract_tables(args.chapter_docx, data)
    if args.dissertation_pdf:
        extract_figures(args.dissertation_pdf, root / "docs" / "figures")
