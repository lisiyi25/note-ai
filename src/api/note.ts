import { mockSuccess } from '@/utils/mock'

export interface NoteItem {
  id: string
  title: string
  summary: string
  cover: string
  tags: string[]
  author: {
    name: string
    avatar: string
  }
  likes: number
  favorites: number
  category: string
  isPublic: boolean
  content: string
  createdAt: string
}

export interface NoteListParams {
  page: number
  pageSize: number
  keyword?: string
}

export interface NoteListResult {
  list: NoteItem[]
  total: number
  page: number
  pageSize: number
}

export interface SaveNotePayload {
  id?: string
  title: string
  category: string
  tags: string[]
  isPublic: boolean
  content: string
  status: 'draft' | 'published'
}

const COVER_COLORS = ['409EFF', '67C23A', 'E6A23C', 'F56C6C', '909399', '1e1e2d']

function coverUrl(seed: string, color: string) {
  return `https://placehold.co/600x360/${color}/ffffff?text=${encodeURIComponent(seed)}`
}

const MOCK_NOTES: NoteItem[] = Array.from({ length: 24 }, (_, i) => {
  const topics = [
    { title: '数据结构入门：线性表与链表', tags: ['数据结构', '链表'], category: '数据结构' },
    { title: '二叉树遍历算法详解', tags: ['树', '算法'], category: '算法' },
    { title: '图论基础与最短路径', tags: ['图', 'Dijkstra'], category: '算法' },
    { title: '哈希表原理与应用场景', tags: ['哈希', '查找'], category: '数据结构' },
    { title: '动态规划经典例题精讲', tags: ['DP', '算法'], category: '算法' },
    { title: '排序算法复杂度对比', tags: ['排序', '复杂度'], category: '算法' },
    { title: '栈与队列的实战应用', tags: ['栈', '队列'], category: '数据结构' },
    { title: '红黑树核心思想解读', tags: ['树', '红黑树'], category: '数据结构' },
  ]
  const t = topics[i % topics.length]
  const color = COVER_COLORS[i % COVER_COLORS.length]
  return {
    id: `note-${i + 1}`,
    title: `${t.title}（#${i + 1}）`,
    summary:
      '本文系统梳理核心概念、复杂度分析与常见面试考点，配合图示与代码示例，帮助你快速建立知识框架并落到实践。',
    cover: coverUrl(t.tags[0], color),
    tags: t.tags,
    author: {
      name: ['Alice', 'Bob', 'Cindy', 'David', 'Eva'][i % 5],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=author${i}`,
    },
    likes: 20 + ((i * 17) % 200),
    favorites: 5 + ((i * 11) % 80),
    category: t.category,
    isPublic: true,
    content: `# ${t.title}

## 概述

本文重点介绍了${t.tags.join('、')}相关的核心概念与实践要点。

## 核心知识点

### 基本定义

- 概念清晰、边界明确
- 关注时间复杂度与空间复杂度
- 掌握典型应用场景

### 代码示例

\`\`\`javascript
function traverse(root) {
  if (!root) return []
  return [root.val, ...traverse(root.left), ...traverse(root.right)]
}
\`\`\`

## 小结

通过系统学习与练习，可以逐步建立起完整的知识网络，并为后续进阶打下坚实基础。
`,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  }
})

/** Mock 笔记列表（支持搜索与分页） */
export async function fetchNoteList(params: NoteListParams) {
  const { page, pageSize, keyword = '' } = params
  const kw = keyword.trim().toLowerCase()
  const filtered = kw
    ? MOCK_NOTES.filter(
        (n) =>
          n.title.toLowerCase().includes(kw) ||
          n.summary.toLowerCase().includes(kw) ||
          n.tags.some((t) => t.toLowerCase().includes(kw)),
      )
    : MOCK_NOTES

  const start = (page - 1) * pageSize
  const list = filtered.slice(start, start + pageSize)

  return mockSuccess<NoteListResult>({
    list,
    total: filtered.length,
    page,
    pageSize,
  })
}

/** Mock 笔记详情 */
export async function fetchNoteDetail(id: string) {
  const note = MOCK_NOTES.find((n) => n.id === id) || MOCK_NOTES[0]
  return mockSuccess<NoteItem>({ ...note, id })
}

/** Mock 保存/发布笔记 */
export async function saveNoteApi(payload: SaveNotePayload) {
  return mockSuccess({
    id: payload.id || `note-${Date.now()}`,
    status: payload.status,
  })
}

/** Mock AI 总结文案 */
export async function fetchAiSummary(_noteId?: string) {
  const text =
    '本文重点介绍了数据结构中的树与二叉树。首先从树的基本定义出发，说明了根节点、叶子节点、深度与高度等核心概念；随后深入讲解二叉树的先序、中序、后序与层序四种遍历方式，并结合递归与非递归实现进行对比；接着分析了二叉搜索树的查找、插入与删除操作及其平均时间复杂度；最后总结了平衡二叉树的意义，以及红黑树、AVL 树在工程中的典型应用场景。整体脉络清晰，适合作为复习与面试准备的系统笔记。'
  return mockSuccess({ summary: text })
}
