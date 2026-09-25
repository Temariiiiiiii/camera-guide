# 相机入门阅读网站

这是《呐，你喜欢摄影吗？——一篇完整的数码相机购买攻略》的静态阅读网站。打开 `index.html` 即可阅读；右上角目录可搜索章节并跳转。

网站正文来自 `article.md`，图片在 `assets/`。在原工作目录中运行 `npm run build` 时，构建脚本优先读取上级目录的 `文章本体.md`，并同步 `article.md`；独立克隆本仓库后，则使用仓库内的 `article.md` 和 `assets/`。

本地重新生成页面：

```sh
npm install
npm run build
```

GitHub Pages 可直接从 `main` 分支的仓库根目录发布，无需服务器。
