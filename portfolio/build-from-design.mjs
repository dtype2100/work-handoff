// Package the reviewed PDF as a visually matching PowerPoint deck.
// v14 adds Typst-authored case dividers, provider UI, review screen, and ending.
// The content artboards remain intact; each slide here is an image.
// Links in the PDF become transparent clickable areas over the same place on each slide,
// so only URLs that the PDF itself links are carried over.
import pptxgen from 'pptxgenjs';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pdf = join(here, '..', 'output', 'pdf', 'AI-Harness-Portfolio-2026-v14.pdf');
const pptx = join(here, '..', 'output', 'pptx', 'AI-Harness-Portfolio-2026-v14.pptx');
const expectedPages = 16;
const slideW = 13.333;
const slideH = 7.5;
// 1×1 fully transparent PNG used as the clickable link area.
const clearPixel = 'image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=';
const scratch = mkdtempSync(join(tmpdir(), 'ai-harness-slides-'));

const unescapeXml = (s) => s.replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

// Linked text boxes per page from `pdftohtml -xml`, in slide inches.
function pdfLinks() {
  const xml = execFileSync('pdftohtml', ['-xml', '-i', '-q', '-stdout', pdf], { encoding: 'utf8' });
  const links = new Map();
  let page = null;
  for (const line of xml.split('\n')) {
    const p = line.match(/<page number="(\d+)"[^>]*height="([\d.]+)" width="([\d.]+)"/);
    if (p) { page = { n: Number(p[1]), h: Number(p[2]), w: Number(p[3]) }; continue; }
    const t = line.match(/<text top="([\d.]+)" left="([\d.]+)" width="([\d.]+)" height="([\d.]+)"[^>]*>.*?<a href="([^"]+)"/);
    if (!t || !page) continue;
    const [top, left, width, height] = t.slice(1, 5).map(Number);
    const url = unescapeXml(t[5]);
    if (!/^https:\/\//.test(url)) continue;
    const pad = 0.04; // inches around the linked text, for an easier click target
    const list = links.get(page.n) ?? [];
    list.push({
      url,
      x: (left / page.w) * slideW - pad, y: (top / page.h) * slideH - pad,
      w: (width / page.w) * slideW + 2 * pad, h: (height / page.h) * slideH + 2 * pad,
    });
    links.set(page.n, list);
  }
  return links;
}

try {
  execFileSync('pdftoppm', ['-png', '-r', '144', pdf, join(scratch, 'page')]);
  const pages = readdirSync(scratch)
    .filter((name) => /^page-\d+\.png$/.test(name))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  if (pages.length !== expectedPages) throw new Error(`Expected ${expectedPages} PDF pages, found ${pages.length}`);
  const links = pdfLinks();

  const deck = new pptxgen();
  deck.layout = 'LAYOUT_WIDE';
  deck.author = 'jinlee';
  deck.title = 'AI 하네스 포트폴리오 2026';
  for (const [index, page] of pages.entries()) {
    const slide = deck.addSlide();
    slide.addImage({
      path: join(scratch, page), x: 0, y: 0, w: slideW, h: slideH,
      altText: `AI 하네스 포트폴리오 ${index + 1}장`,
    });
    for (const link of links.get(index + 1) ?? []) {
      slide.addImage({
        data: clearPixel, x: link.x, y: link.y, w: link.w, h: link.h,
        hyperlink: { url: link.url, tooltip: link.url }, altText: link.url,
      });
      console.log(`slide ${index + 1}: link ${link.url}`);
    }
  }
  await deck.writeFile({ fileName: pptx });
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
