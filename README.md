# NoteAI · 智能知识笔记

基于 **Vue 3 + Vite + TypeScript** 的前端项目，集成笔记广场、Markdown 编辑器、AI Copilot、知识图谱与 RBAC 角色菜单。

## 在线预览

部署到 GitHub Pages 后地址为：

`https://<你的GitHub用户名>.github.io/note-ai/`

## 本地运行

```bash
npm install
npm run dev
```

构建：

```bash
npm run build
```

## 演示说明

- 登录：账号 ≥ 3 位，密码 ≥ 6 位即可（Mock）
- 账号含 `admin` 可直接以管理员登录，或登录后用右上角切换「学生 / 管理员」
- 学生：笔记广场、我的笔记、知识图谱
- 管理员：用户管理、内容审核、数据看板

## 技术栈

- Vue 3 / Vue Router / Pinia / Element Plus
- Vditor / markdown-it / highlight.js / ECharts / Axios / Sass

## 目录结构

```
src/
├── api/
├── components/   # 含 AiAgent Copilot
├── layout/
├── router/
├── store/
├── styles/
├── utils/
└── views/
```
