"""
Extracts daily stock movement from the Tally "Movement Analysis" PDF exports.

The PDFs carry the same daily grain as the xlsx exports, but text extraction
alone cannot tell an inward figure from an outward one — both are bare numbers
on the same line. The split is positional, so every number is assigned to a
column by its x coordinate, read from the page's own header row rather than
hardcoded, so a differently-formatted export cannot silently land the numbers
in the wrong column.

Some of these exports (April, July) also carry batch-code sub-rows that sum
exactly to the product row above them — counting both doubles every figure, so
those are dropped. The June export happens not to contain them, which is why a
per-file check matters rather than assuming one shape.

The exports also differ in period: most pages cover a single day ("For
1-Jun-26"), but the July file is one report spanning 1–12 Jul. Both ends of the
period travel with each row so a 12-day total is never mistaken for a day's.

Output: JSON on stdout — [{periodStart, periodEnd, product, inwardQty,
inwardRate, inwardValue, outwardQty, outwardRate, outwardValue}]
"""

import json
import re
import sys

import pdfplumber

NUM = re.compile(r"^-?[\d,]+(?:\.\d+)?$")


def parse_number(text):
    try:
        return float(text.replace(",", ""))
    except ValueError:
        return None


def column_split_x(page):
    """Midpoint between the Inward and Outward column groups, from the header."""
    words = page.extract_words()
    inward = next((w for w in words if w["text"] == "Inward"), None)
    outward = next((w for w in words if w["text"] == "Outward"), None)
    if not inward or not outward:
        return None
    return (inward["x1"] + outward["x0"]) / 2


def body_starts_below(page):
    """
    Vertical position of the column-header row ("Quantity Eff. Rate Value").

    Everything above it is page chrome — company address, the "XIAOMI /
    Movement Analysis" title, the date. Without this cut the title line parses
    as a product and carries stray numbers into the totals.
    """
    tops = [w["top"] for w in page.extract_words() if w["text"] in ("Quantity", "Eff.")]
    return max(tops) if tops else 0


def page_period(text):
    """
    The period a page covers.

    Two shapes appear across these exports: a per-day page ("For 1-Jun-26") and
    a whole-period report ("1-Jul-26 to 12-Jul-26"). Returning both the start
    and the end lets the caller keep daily rows daily without silently
    presenting a 12-day total as if it were one day's trade.
    """
    text = text or ""
    span = re.search(r"(\d{1,2}-\w{3}-\d{2})\s+to\s+(\d{1,2}-\w{3}-\d{2})", text)
    if span:
        return span.group(1), span.group(2)
    day = re.search(r"For (\d{1,2}-\w{3}-\d{2})", text)
    if day:
        return day.group(1), day.group(1)
    return None, None


def extract(path):
    rows = []
    # One row per (period, product). The July export prints the same 12-day
    # report 30 times over (sections A…AD), which would otherwise multiply
    # every figure by 30; a product also cannot legitimately appear twice
    # within one period, so keeping the first occurrence is safe for every
    # file shape here.
    seen = set()
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            period_start, period_end = page_period(text)
            if not period_start:
                continue
            split_x = column_split_x(page)
            if split_x is None:
                continue
            body_top = body_starts_below(page)

            # Group words into visual lines by their vertical position, ignoring
            # everything above the column headers.
            lines = {}
            for w in page.extract_words():
                if w["top"] <= body_top:
                    continue
                key = round(w["top"] / 3)
                lines.setdefault(key, []).append(w)

            for _, words in sorted(lines.items()):
                words.sort(key=lambda w: w["x0"])
                name_parts = [w["text"] for w in words if w["x1"] < 300]
                name = " ".join(name_parts).strip()
                if not name or name.startswith(("Particulars", "Page", "Grand Total")):
                    continue

                # Batch/lot sub-rows carry a location ("1774 Main Location") and
                # sum exactly to the product row above them. Counting both
                # doubles every figure, so only the product row is kept.
                if re.search(r"\bMain Location\b", name, re.I):
                    continue

                inward, outward = [], []
                for w in words:
                    if w["x0"] < 300 or w["text"] == "PCS":
                        continue
                    value = parse_number(w["text"]) if NUM.match(w["text"]) else None
                    if value is None:
                        continue
                    (inward if w["x0"] < split_x else outward).append(value)

                if not inward and not outward:
                    continue

                def triple(values):
                    # Left-to-right within a group: quantity, rate, value.
                    # Padded to exactly three so a column group that is absent
                    # (or partly absent) still unpacks.
                    padded = list(values[:3]) + [None] * 3
                    return padded[0], padded[1], padded[2]

                in_q, in_r, in_v = triple(inward)
                out_q, out_r, out_v = triple(outward)

                dedupe_key = (period_start, period_end, name.upper())
                if dedupe_key in seen:
                    continue
                seen.add(dedupe_key)

                rows.append({
                    "periodStart": period_start,
                    "periodEnd": period_end,
                    "product": name,
                    "inwardQty": in_q,
                    "inwardRate": in_r,
                    "inwardValue": in_v,
                    "outwardQty": out_q,
                    "outwardRate": out_r,
                    "outwardValue": out_v,
                })
    return rows


if __name__ == "__main__":
    all_rows = []
    for path in sys.argv[1:]:
        all_rows.extend(extract(path))
    json.dump(all_rows, sys.stdout)
