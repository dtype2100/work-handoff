"""Assemble the v16 PDF from v15 and the two v16 Typst sources.

Run: uv run --no-project --with pypdf==5.9.0 --with pymupdf==1.26.4 python portfolio/assemble-v16.py
"""

from pathlib import Path
from subprocess import run
from tempfile import TemporaryDirectory

import fitz
from pypdf import PdfReader, PdfWriter


ROOT = Path(__file__).resolve().parents[1]
PORTFOLIO = ROOT / "portfolio"
SOURCE = ROOT / "output/pdf/AI-Harness-Portfolio-2026-v15.pdf"
TARGET = ROOT / "output/pdf/AI-Harness-Portfolio-2026-v16.pdf"
LINKEDIN = "https://www.linkedin.com/in/%EC%A7%84%EC%9B%85-%EC%9D%B4-0088421a9/"


def render(name: str, target: Path) -> None:
    run(
        ["typst", "compile", "--font-path", str(PORTFOLIO / "fonts"),
         str(PORTFOLIO / name), str(target)],
        check=True,
    )


def main() -> None:
    with TemporaryDirectory(prefix="ai-harness-v16-") as directory:
        scratch = Path(directory)
        slide = scratch / "slide03.pdf"
        overlay = scratch / "cover-profile.pdf"
        redacted = scratch / "redacted.pdf"
        render("slide03-v16.typ", slide)
        render("cover-profile-v16.typ", overlay)

        with fitz.open(SOURCE) as document:
            page = document[0]
            page.add_redact_annot(
                fitz.Rect(66, 522.3, 615, 557.1),
                fill=(243 / 255, 241 / 255, 234 / 255),
            )
            page.apply_redactions(images=0, graphics=0, text=0)
            document.save(redacted, garbage=4, deflate=True)

        source = PdfReader(redacted)
        replacement = PdfReader(slide)
        overlays = PdfReader(overlay)
        assert len(source.pages) == 16
        assert len(replacement.pages) == 1 and len(overlays.pages) == 2
        source.pages[0].merge_page(overlays.pages[0])
        source.pages[1].merge_page(overlays.pages[1])

        writer = PdfWriter()
        for index, page in enumerate(source.pages):
            writer.add_page(replacement.pages[0] if index == 2 else page)
        # PDF annotation rectangles use a bottom-left origin; the label is at
        # x=66..200, y=251..268 in Typst's top-left coordinates.
        writer.add_uri(1, LINKEDIN, (64, 540, 203, 561), border=[0, 0, 0])
        writer.add_metadata({"/Title": "AI 하네스 포트폴리오 2026", "/Author": "이진웅"})
        with TARGET.open("wb") as output:
            writer.write(output)
    print(TARGET)


if __name__ == "__main__":
    main()
