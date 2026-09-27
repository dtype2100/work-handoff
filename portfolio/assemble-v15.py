"""Replace three portfolio pages and remove two redundant footer notes.

Run: uv run --no-project --with pypdf==5.9.0 --with pymupdf==1.26.4 python portfolio/assemble-v15.py
"""

from pathlib import Path
from subprocess import run
from tempfile import TemporaryDirectory

import fitz
from pypdf import PdfReader, PdfWriter


ROOT = Path(__file__).resolve().parents[1]
PORTFOLIO = ROOT / "portfolio"
SOURCE = ROOT / "output/pdf/AI-Harness-Portfolio-2026-v14.pdf"
TARGET = ROOT / "output/pdf/AI-Harness-Portfolio-2026-v15.pdf"
PAPER = (243 / 255, 241 / 255, 234 / 255)
REVISIONS = {2: "slide03-v15.typ", 13: "slide14-v15.typ", 14: "slide15-v15.typ"}


def render(source: Path, target: Path) -> None:
    run(
        ["typst", "compile", "--font-path", str(PORTFOLIO / "fonts"), str(source), str(target)],
        check=True,
    )


def main() -> None:
    with TemporaryDirectory(prefix="ai-harness-v15-") as scratch:
        scratch = Path(scratch)
        revised = {}
        for index, name in REVISIONS.items():
            target = scratch / f"slide-{index + 1}.pdf"
            render(PORTFOLIO / name, target)
            page = PdfReader(target).pages
            assert len(page) == 1
            revised[index] = page[0]

        redacted = scratch / "redacted.pdf"
        with fitz.open(SOURCE) as document:
            for index, area in {
                4: (64, 677, 1375, 732),  # slide 5: redundant independent-case footnote
                6: (64, 712, 700, 740),  # slide 7: test count footnote
            }.items():
                page = document[index]
                page.add_redact_annot(fitz.Rect(*area), fill=PAPER)
                page.apply_redactions(images=0, graphics=0, text=0)
            document.save(redacted, garbage=4, deflate=True)

        source = PdfReader(redacted)
        assert len(source.pages) == 16
        writer = PdfWriter()
        for index, page in enumerate(source.pages):
            writer.add_page(revised.get(index, page))
        writer.add_metadata({"/Title": "AI 하네스 포트폴리오 2026", "/Author": "이진웅"})
        with TARGET.open("wb") as output:
            writer.write(output)
    print(TARGET)


if __name__ == "__main__":
    main()
