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

const captions = new Map([
  [1, '常见传感器画幅的尺寸对比'],
  [2, '电子快门拍摄快速运动物体时出现的果冻效应'],
  [3, '人工灯光下，电子快门照片中的明暗横纹'],
  [4, '上下翻折屏与侧翻屏的展开方式'],
  [5, '尼康 D3100 与两支入门镜头'],
  [6, '索尼 A6000 与 16–50 mm 套头'],
  [7, '索尼 A6300 与 16–50 mm 套头'],
  [8, '尼康 D7200 与 18–140 mm 镜头'],
  [9, '奥林巴斯 E-M10 II 与两支变焦镜头'],
  [10, '松下 G100 与 12–32 mm 镜头'],
  [11, '索尼 A6400、ZV-E10 与 16–50 mm 套头'],
  [12, '尼康 D610 与 24–120 mm、50 mm 镜头'],
  [13, '奥林巴斯 E-M5 II 与 14–42 mm 镜头'],
  [14, '索尼 A6400、ZV-E10 与 18–135 mm 镜头'],
  [15, '佳能 EOS R50 与 RF-S 18–45 mm 镜头'],
  [16, '尼康 Z50 与两支 DX 变焦镜头'],
  [17, '作者的尼康 Z5 与 Z 24–50 mm 镜头'],
  [18, '佳能 EOS R8 与 RF 24–50 mm 镜头'],
  [19, '尼康 Z50 II 与入门镜头组合'],
  [20, '索尼 A7 III 与腾龙 28–200 mm 镜头'],
  [21, '佳能 EOS R10 与 RF-S 18–150 mm 镜头'],
  [22, '佳能 EOS R6 Mark II 与银圈 24–105 mm 镜头'],
  [23, '索尼 A7C II、A7 IV 与腾龙 28–200 mm 镜头'],
  [24, '尼康 Zf 与 Z 24–70 mm、Z 40 mm 镜头'],
  [25, '索尼 A6700 与可选的变焦镜头'],
  [26, '索尼 A7C II、A7 IV 与标准变焦镜头'],
  [27, '尼康 Z5 II 与可选的 Z 卡口镜头'],
  [28, '佳能 EOS R6 Mark II 与红圈 24–105 mm 镜头'],
  [29, '索尼 A7 V 与 FE 20–70 mm f/4 G 镜头'],
  [30, '尼康 Z6 III 与 Z 24–120 mm f/4 S 镜头'],
  [31, '佳能 EOS R6 Mark III 与 RF 24–105 mm 镜头'],
  [32, '尼康机身与 Z 180–600 mm 长焦镜头'],
  [33, '索尼全画幅机身的日常镜头与长焦镜头组合'],
  [35, '24、35、50、85、135 mm 焦段的人像视角对比'],
  [36, '同一场景在 f/4、f/8、f/16 下的景深对比'],
  [38, '特朗普遇袭后举拳的照片'],
  [39, '作者在适马会津工厂外与两支 I Series 镜头合影'],
]);
const usedImages = new Set();
const articleWithFigures = source.split(/\r?\n/).map(line => {
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
  const caption = captions.get(number);
  if (!caption) throw new Error(`图片${number}缺少图注`);
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
    <button class="toc-toggle" id="tocToggle" type="button" aria-controls="tocDrawer" aria-expanded="false"><span aria-hidden="true">☰</span> 目录</button>
  </header>
  <main id="top">
    <div class="hero"><h1>${escapeHtml(articleTitle)}</h1></div>
    <div class="content-wrap"><article id="article" class="article">${body.replace(/^<h1>[\s\S]*?<\/h1>\s*/, '')}</article></div>
  </main>
  <div class="drawer-backdrop" id="drawerBackdrop" hidden></div>
  <aside class="toc-drawer" id="tocDrawer" aria-label="文章目录" aria-hidden="true">
    <div class="drawer-header"><h2>文章目录</h2><button class="drawer-close" id="tocClose" type="button" aria-label="关闭目录">×</button></div>
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
