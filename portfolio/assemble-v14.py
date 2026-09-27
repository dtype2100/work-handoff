"""Assemble the 16-page portfolio from reviewed v12 pages and new sections.

Run with: uv run --no-project --with pypdf==5.9.0 --with pymupdf==1.26.4 python portfolio/assemble-v14.py
Typst is used only at build time. Old labels are redacted before the updated
text is overlaid, so PDF search does not expose stale slide references.
"""

from pathlib import Path
from subprocess import run
from tempfile import TemporaryDirectory

import fitz
from pypdf import PdfReader, PdfWriter


ROOT = Path(__file__).resolve().parents[1]
PORTFOLIO = ROOT / "portfolio"
SOURCE = ROOT / "output/pdf/AI-Harness-Portfolio-2026-v12.pdf"
TARGET = ROOT / "output/pdf/AI-Harness-Portfolio-2026-v14.pdf"
PAPER = (243 / 255, 241 / 255, 234 / 255)

# Source-page index -> visual regions overwritten by content-overlays-v14.typ.
REDACTIONS = {
    0: [(285, 718, 398, 743), (820, 718, 858, 743), (1245, 718, 1289, 743)],
    1: [(734, 386, 879, 415), (734, 492, 784, 520), (734, 572, 784, 600)],
    3: [(64, 43, 93, 70), (200, 164, 1148, 321), (463, 541, 884, 620), (1014, 643, 1042, 669), (260, 684, 1048, 731)],
    4: [(64, 43, 93, 70)],
    5: [(64, 43, 93, 70)],
    6: [(66, 276, 440, 363), (66, 617, 440, 708)],
    9: [(64, 43, 93, 70)],
    10: [(64, 43, 93, 70), (177, 386, 284, 411), (171, 518, 208, 540), (219, 638, 255, 661)],
}
for source_page in range(1, 11):
    REDACTIONS.setdefault(source_page, []).append((1197, 752, 1375, 785))


def render(source: Path, target: Path) -> None:
    run(
        ["typst", "compile", "--font-path", str(PORTFOLIO / "fonts"), str(source), str(target)],
        check=True,
    )


def redact(source: Path, target: Path) -> None:
    with fitz.open(source) as document:
        for index, areas in REDACTIONS.items():
            page = document[index]
            for area in areas:
                page.add_redact_annot(fitz.Rect(*area), fill=PAPER)
            page.apply_redactions(images=0, graphics=0, text=0)
        document.save(target, garbage=4, deflate=True)


def main() -> None:
    with TemporaryDirectory(prefix="ai-harness-v14-") as scratch:
        extra_pdf = Path(scratch) / "sections.pdf"
        overlay_pdf = Path(scratch) / "overlays.pdf"
        redacted_pdf = Path(scratch) / "redacted.pdf"
        render(PORTFOLIO / "section-pages-v14.typ", extra_pdf)
        render(PORTFOLIO / "content-overlays-v14.typ", overlay_pdf)
        redact(SOURCE, redacted_pdf)

        content = PdfReader(redacted_pdf)
        extras = PdfReader(extra_pdf)
        overlays = PdfReader(overlay_pdf)
        assert len(content.pages) == len(overlays.pages) == 11
        assert len(extras.pages) == 6

        for original, overlay in zip(content.pages, overlays.pages):
            original.merge_page(overlay)

        # 1–3 overview; Work Handoff 4–10; Evidence Review 11–12;
        # coordination 13–14; observed results 15; closing 16.
        order = [
            (content, 0), (content, 1), (content, 2),
            (extras, 0),
            (content, 3), (content, 4), (content, 6),
            (extras, 1), (extras, 2), (content, 8),
            (extras, 3), (content, 5),
            (extras, 4), (content, 9),
            (content, 10), (extras, 5),
        ]
        writer = PdfWriter()
        for document, index in order:
            writer.add_page(document.pages[index])
        writer.add_metadata({"/Title": "AI 하네스 포트폴리오 2026", "/Author": "이진웅"})
        with TARGET.open("wb") as output:
            writer.write(output)
    print(TARGET)


if __name__ == "__main__":
    main()
