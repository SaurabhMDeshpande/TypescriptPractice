"""Build MySQL_Interview_Book.pdf from the Markdown chapters in ./book.

Usage:  pip install markdown pygments
        python3 build_pdf.py      (then render_pdf.js prints it to PDF with Playwright)
"""
import pathlib
import re
import subprocess

import markdown
from pygments.formatters import HtmlFormatter

HERE = pathlib.Path(__file__).parent
CHAPTERS = sorted((HERE / "book").glob("*.md"))
OUT_HTML = HERE / "book" / "MySQL_Interview_Book.html"
OUT_PDF = HERE / "MySQL_Interview_Book.pdf"

CSS = """
@page { size: A4; margin: 18mm 15mm 18mm 15mm; }
body { font-family: 'DejaVu Sans', 'Liberation Sans', Arial, sans-serif; font-size: 10.5pt;
       line-height: 1.45; color: #1d2433; }
h1 { font-size: 19pt; color: #0b4f6c; border-bottom: 3px solid #0b4f6c; padding-bottom: 4px;
     margin-top: 26px; page-break-after: avoid; }
h2 { font-size: 14pt; color: #0b4f6c; margin-top: 20px; page-break-after: avoid; }
h3 { font-size: 11.5pt; color: #8a3b12; margin-top: 16px; margin-bottom: 4px; page-break-after: avoid; }
p, li { orphans: 3; widows: 3; }
code { font-family: 'DejaVu Sans Mono', 'Liberation Mono', monospace; font-size: 9pt;
       background: #eef2f6; padding: 1px 3px; border-radius: 3px; }
pre { background: #f6f8fa; border: 1px solid #d5dce4; border-left: 4px solid #0b4f6c;
      padding: 8px 10px; border-radius: 4px; white-space: pre-wrap; word-break: break-word;
      page-break-inside: avoid; font-size: 8.8pt; line-height: 1.35; }
pre code { background: none; padding: 0; font-size: inherit; }
table { border-collapse: collapse; margin: 8px 0 12px; font-size: 9pt; page-break-inside: avoid; }
th { background: #0b4f6c; color: #fff; text-align: left; padding: 4px 7px; }
td { border: 1px solid #cfd8e3; padding: 3px 7px; vertical-align: top; }
tr:nth-child(even) td { background: #f4f7fa; }
blockquote { border-left: 4px solid #e0a100; background: #fff8e1; margin: 10px 0;
             padding: 6px 12px; }
.pb { page-break-after: always; }
.cover { height: 250mm; display: flex; flex-direction: column; justify-content: center;
         text-align: center; page-break-after: always; }
.cover h1 { border: none; font-size: 34pt; margin: 0; }
.cover .sub { font-size: 15pt; color: #8a3b12; margin-top: 12px; }
.cover .meta { margin-top: 40px; font-size: 11pt; color: #555; line-height: 1.8; }
.toc { page-break-after: always; }
.toc h1 { margin-top: 0; }
.toc ul { list-style: none; padding-left: 0; columns: 1; }
.toc li { margin: 3px 0; }
.toc li.part { font-weight: bold; color: #8a3b12; margin-top: 10px; }
.toc a { color: #1d2433; text-decoration: none; }
"""

COVER = """
<div class="cover">
  <h1>MySQL Interview Book</h1>
  <div class="sub">for QA Engineers (≈ 4 years experience)</div>
  <div class="meta">
    All core MySQL concepts with examples<br>
    54 interview query problems with verified output<br>
    (2nd / Nth highest salary, duplicates, joins, window functions, and more)<br>
    Database testing for QA &middot; 70 theory Q&amp;A &middot; Cheat sheet
  </div>
</div>
"""


def build_html() -> str:
    md_text = "\n\n".join(p.read_text(encoding="utf-8") for p in CHAPTERS)
    md = markdown.Markdown(
        extensions=["tables", "fenced_code", "codehilite", "toc", "sane_lists"],
        extension_configs={"codehilite": {"guess_lang": False, "css_class": "hl"},
                           "toc": {"toc_depth": "1-2"}},
    )
    body = md.convert(md_text)

    items = []
    for tok in md.toc_tokens:
        cls = ' class="part"' if tok["name"].startswith("PART") else ""
        items.append(f'<li{cls}><a href="#{tok["id"]}">{tok["name"]}</a></li>')
        if tok["name"].startswith("PART B"):
            for sub in tok["children"]:
                items.append(f'<li style="padding-left:14px">&bull; <a href="#{sub["id"]}">{sub["name"]}</a></li>')
    toc = '<div class="toc"><h1>Contents</h1><ul>' + "".join(items) + "</ul></div>"

    # every PART heading starts on a new page
    body = re.sub(r'(<h1 id="part-)', r'<div class="pb"></div>\1', body)

    pyg = HtmlFormatter(style="friendly").get_style_defs(".hl")
    return (f"<!doctype html><html><head><meta charset='utf-8'><title>MySQL Interview Book</title>"
            f"<style>{CSS}\n{pyg}</style></head><body>{COVER}{toc}{body}</body></html>")


def main() -> None:
    OUT_HTML.write_text(build_html(), encoding="utf-8")
    subprocess.run(["node", str(HERE / "render_pdf.js"), str(OUT_HTML), str(OUT_PDF)], check=True)
    print(f"wrote {OUT_PDF}")


if __name__ == "__main__":
    main()
