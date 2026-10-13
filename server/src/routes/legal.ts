import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import { marked } from 'marked';

const router = Router();

const DOCS: Record<string, { file: string; title: string }> = {
  privacy: { file: 'privacy.md', title: '개인정보처리방침' },
  terms: { file: 'terms.md', title: '서비스 이용약관' },
  'purchase-refund': { file: 'purchase-refund.md', title: '구매 및 환불 안내' },
  'account-deletion': { file: 'account-deletion.md', title: '계정 삭제 안내' },
};

const LEGAL_DIR = path.join(__dirname, '..', 'legal');

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const STYLE = `
:root{color-scheme:light dark;--bg:#f6f8f6;--fg:#14201a;--muted:#54635a;--card:#fff;--line:#d9e1db;--accent:#2e7d32}
@media (prefers-color-scheme:dark){:root{--bg:#0a1a0a;--fg:#eef3ee;--muted:#a3b3a8;--card:#13261a;--line:#264033;--accent:#66bb6a}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.7 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",Roboto,sans-serif}
main{max-width:760px;margin:0 auto;padding:24px 16px 56px}
article{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px 20px 8px}
h1{font-size:1.6rem;line-height:1.3;margin:.2em 0 .6em}h2{font-size:1.2rem;margin:1.8em 0 .5em}h3{font-size:1.05rem;margin:1.4em 0 .4em}
a{color:var(--accent)}ul,ol{padding-left:1.3em}li{margin:.25em 0}
table{border-collapse:collapse;width:100%;margin:1em 0;font-size:.95rem}th,td{border:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}
nav{margin:0 0 16px;font-size:.95rem;display:flex;flex-wrap:wrap;gap:6px 16px}nav a{text-decoration:none}
footer{margin-top:20px;color:var(--muted);font-size:.85rem}
`;

function page(title: string, body: string, current?: string): string {
  const nav = Object.entries(DOCS)
    .map(([slug, d]) =>
      slug === current
        ? `<strong>${escapeHtml(d.title)}</strong>`
        : `<a href="/legal/${slug}">${escapeHtml(d.title)}</a>`,
    )
    .join('');
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} - GTOPlaybook</title><style>${STYLE}</style></head>
<body><main><nav>${nav}</nav><article>${body}</article>
<footer>진소프트 · 사업자등록번호 827-53-01093 · 문의 kjinyz@naver.com</footer></main></body></html>`;
}

const cache = new Map<string, string>();

function render(slug: string): string | null {
  const doc = DOCS[slug];
  if (!doc) return null;
  const hit = cache.get(slug);
  if (hit) return hit;
  const markdown = fs.readFileSync(path.join(LEGAL_DIR, doc.file), 'utf8');
  const html = page(doc.title, marked.parse(markdown, { async: false }) as string, slug);
  cache.set(slug, html);
  return html;
}

router.get('/', (_req, res) => {
  const items = Object.entries(DOCS)
    .map(([slug, d]) => `<li><a href="/legal/${slug}">${escapeHtml(d.title)}</a></li>`)
    .join('');
  res.type('html').send(page('약관 및 정책', `<h1>약관 및 정책</h1><ul>${items}</ul>`));
});

router.get('/:slug', (req, res) => {
  const html = render(req.params.slug);
  if (!html) {
    res.status(404).type('html').send(page('찾을 수 없음', '<h1>문서를 찾을 수 없어요</h1>'));
    return;
  }
  res.type('html').send(html);
});

export default router;
