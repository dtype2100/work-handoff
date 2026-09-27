"""Replace six authored headings in a supplied v16 PDF.

Run: uv run --no-project --with pymupdf==1.26.4 --with pypdf==5.9.0 python portfolio/replace-v16-headings.py /path/to/AI-Harness-Portfolio-2026-v16.pdf
"""

import sys
from pathlib import Path
from subprocess import run
from tempfile import TemporaryDirectory

import fitz
from pypdf import PdfReader, PdfWriter


ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "output/pdf/AI-Harness-Portfolio-2026-v16.pdf"
HEADINGS = {
    6: ("기억 공유는 파일로: 남긴 파일을 다음 작업에서 다시 열 수 있다",),
    7: ("인계 파일의 항목마다 근거와 검토 상태가 함께 남는다",),
    8: ("한 번 선택하고 초안을 만든다",),
    9: ("원문 옆에서 초안을 고치고 검토 상태를 남긴다",),
    11: ("주장·체크·판정을 분리해", "검증 범위를 드러낸다"),
    14: ("계약으로 분리하고, 리뷰 지적을 원 작성자에게 되돌렸다",),
}


def main(source: Path) -> None:
    with TemporaryDirectory(prefix="ai-harness-v16-headings-") as scratch:
        scratch = Path(scratch)
        overlay = scratch / "headings.pdf"
        run(
            ["typst", "compile", "--font-path", str(ROOT / "portfolio/fonts"),
             str(ROOT / "portfolio/headings-v16.typ"), str(overlay)],
            check=True,
        )
        with fitz.open(source) as document:
            assert len(document) == 16
            for number, old_lines in HEADINGS.items():
                page = document[number - 1]
                for old in old_lines:
                    matches = page.search_for(old)
                    assert len(matches) == 1, (number, old, matches)
                    page.add_redact_annot(matches[0], fill=False)
                page.apply_redactions(images=0, graphics=0, text=0)
            redacted = scratch / "redacted.pdf"
            document.save(redacted, garbage=4, deflate=True)

        original = PdfReader(redacted)
        replacements = PdfReader(overlay)
        assert len(replacements.pages) == len(HEADINGS)
        writer = PdfWriter()
        for index, page in enumerate(original.pages):
            number = index + 1
            if number in HEADINGS:
                page.merge_page(replacements.pages[list(HEADINGS).index(number)])
            writer.add_page(page)
        writer.add_metadata({"/Title": "AI 하네스 포트폴리오 2026", "/Author": "이진웅"})
        TARGET.parent.mkdir(parents=True, exist_ok=True)
        with TARGET.open("wb") as output:
            writer.write(output)
    print(TARGET)


if __name__ == "__main__":
    main(Path(sys.argv[1]))
