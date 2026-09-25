import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, readdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const root = dirname(fileURLToPath(import.meta.url));
const parentArticle = join(root, '..', '文章本体.md');
const localArticle = join(root, 'article.md');
const imageDir = join(root, '..', '图片');
const assetDir = join(root, 'assets');
mkdirSync(assetDir, { recursive: true });

const sourcePath = existsSync(parentArticle) ? parentArticle : localArticle;
if (!existsSync(sourcePath)) throw new Error('找不到 article.md 或上级目录中的文章本体.md');
const source = readFileSync(sourcePath, 'utf8');
if (sourcePath === parentArticle) writeFileSync(localArticle, source, 'utf8');

const escapeHtml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const headingRows = [...source.matchAll(/^(#{2,4})\s+(.+)\r?$/gm)].map((match, index) => {
  const level = match[1].length;
  const title = match[2].trim();
  const number = title.match(/^(\d+(?:\.\d+)*)\s+/)?.[1];
  const id = number ? `section-${number.replaceAll('.', '-')}` : (title === '引言' ? 'intro' : `heading-${index + 1}`);
  return { level, title, id };
});

let nearestHeading = '相机购买攻略';
const usedImages = new Set();
const articleWithFigures = source.split(/\r?\n/).map(line => {
  const heading = line.match(/^#{2,4}\s+(.+)$/);
  if (heading) nearestHeading = heading[1].replace(/^\d+(?:\.\d+)*\s+/, '').trim();
  const image = line.match(/^图片(\d+)$/);
  if (!image) return line;
  const number = Number(image[1]);
  usedImages.add(number);
  let assetName;
  if (existsSync(imageDir)) {
    const matches = readdirSync(imageDir).filter(name => new RegExp(`^图片${number}\\.[^.]+$`).test(name));
    if (matches.length !== 1) throw new Error(`图片${number}：应有且仅有一个对应文件，找到 ${matches.length} 个`);
    const extension = extname(matches[0]).toLowerCase();
    assetName = `image-${number}${extension}`;
    copyFileSync(join(imageDir, matches[0]), join(assetDir, assetName));
  } else {
    const matches = readdirSync(assetDir).filter(name => new RegExp(`^image-${number}\\.[^.]+$`).test(name));
    if (matches.length !== 1) throw new Error(`缺少图片${number}的站点资源`);
    assetName = matches[0];
  }
  const caption = nearestHeading;
  return `<figure class="article-figure"><img src="assets/${assetName}" alt="${escapeHtml(caption)}" loading="lazy" decoding="async"><figcaption>${escapeHtml(caption)}</figcaption></figure>`;
}).join('\n');

marked.setOptions({ gfm: true });
let body = marked.parse(articleWithFigures);
let headingIndex = 0;
body = body.replace(/<h([2-4])>([\s\S]*?)<\/h\1>/g, (whole, level, inner) => {
  const heading = headingRows[headingIndex++];
  if (!heading || heading.level !== Number(level)) throw new Error('目录标题与正文标题不一致');
  return `<h${level} id="${heading.id}">${inner}<a class="heading-anchor" href="#${heading.id}" aria-label="链接到本节">#</a></h${level}>`;
});
if (headingIndex !== headingRows.length) throw new Error('有目录标题未被渲染');

const toc = headingRows.map(h => `<a class="toc-link toc-level-${h.level}" href="#${h.id}" data-target="${h.id}">${escapeHtml(h.title)}</a>`).join('\n');
const articleTitle = source.match(/^#\s+(.+)$/m)?.[1] ?? '相机购买攻略';
const sectionCount = headingRows.filter(h => h.level === 2).length - 1;
const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f8f6f1">
  <meta name="description" content="从画幅、镜头与机身参数，到各预算段的相机购买建议与拍摄入门。">
  <title>${escapeHtml(articleTitle)}</title>
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="progress" id="readingProgress" aria-hidden="true"></div>
  <a class="skip-link" href="#article">跳转到正文</a>
  <header class="site-header">
    <a class="brand" href="#top" aria-label="返回文章顶部"><span class="brand-mark">◎</span><span>相机入门</span></a>
    <div class="header-actions"><span class="header-note">一篇从零开始的购买攻略</span><button class="toc-toggle" id="tocToggle" type="button" aria-controls="tocDrawer" aria-expanded="false"><span aria-hidden="true">☰</span> 目录</button></div>
  </header>
  <main id="top">
    <div class="hero"><p class="eyebrow">摄影 · 器材 · 入门</p><p class="hero-kicker">给第一次认真选相机的你</p><h1>${escapeHtml(articleTitle)}</h1><p class="hero-description">从“我真的需要相机吗”开始，慢慢弄懂画幅、镜头、机身、预算，以及相机到手后怎么拍。</p><div class="hero-meta"><span>${sectionCount} 个章节</span><span>${usedImages.size} 张配图</span><button type="button" class="hero-toc" id="heroToc">打开目录 <span aria-hidden="true">↗</span></button></div></div>
    <div class="content-wrap"><article id="article" class="article">${body.replace(/^<h1>[\s\S]*?<\/h1>\s*/, '')}</article><footer class="article-footer"><p>读到这里，祝你找到愿意带出门、愿意一直用的那台相机。</p><a href="#top">回到顶部 ↑</a></footer></div>
  </main>
  <div class="drawer-backdrop" id="drawerBackdrop" hidden></div>
  <aside class="toc-drawer" id="tocDrawer" aria-label="文章目录" aria-hidden="true">
    <div class="drawer-header"><div><p class="drawer-eyebrow">NAVIGATION</p><h2>文章目录</h2></div><button class="drawer-close" id="tocClose" type="button" aria-label="关闭目录">×</button></div>
    <label class="search-label" for="tocSearch">搜索章节</label><input id="tocSearch" class="toc-search" type="search" placeholder="输入关键词，快速定位…" autocomplete="off">
    <nav id="tocLinks" class="toc-links" aria-label="章节跳转">${toc}</nav>
    <p class="toc-empty" id="tocEmpty" hidden>没有找到匹配的章节。</p>
  </aside>
  <button class="back-top" id="backTop" type="button" aria-label="返回顶部">↑</button>
  <script src="app.js" defer></script>
</body>
</html>`;
writeFileSync(join(root, 'index.html'), html, 'utf8');
console.log(`生成 index.html：${headingRows.length} 个目录条目、${usedImages.size} 张图片。`);
