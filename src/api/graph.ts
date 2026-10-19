import { mockSuccess } from '@/utils/mock'

export type GraphCategory = 'concept' | 'algorithm' | 'structure'

export interface GraphNode {
  id: string
  name: string
  category: GraphCategory
  value: number
  desc: string
}

export interface GraphLink {
  source: string
  target: string
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

const BASE_NODES: GraphNode[] = [
  { id: '1', name: '数据结构', category: 'structure', value: 40, desc: '组织与存储数据的方式' },
  { id: '2', name: '链表', category: 'structure', value: 28, desc: '通过指针串联的线性结构' },
  { id: '3', name: '树', category: 'structure', value: 32, desc: '层次化非线性结构' },
  { id: '4', name: '二叉树', category: 'structure', value: 30, desc: '每个节点最多两个子节点' },
  { id: '5', name: '算法', category: 'algorithm', value: 38, desc: '解决问题的明确步骤' },
  { id: '6', name: '排序', category: 'algorithm', value: 26, desc: '将序列按规则有序化' },
  { id: '7', name: '动态规划', category: 'algorithm', value: 28, desc: '最优子结构与重叠子问题' },
  { id: '8', name: '图', category: 'structure', value: 30, desc: '顶点与边构成的关系网络' },
  { id: '9', name: '复杂度', category: 'concept', value: 24, desc: '衡量算法效率的核心指标' },
  { id: '10', name: '递归', category: 'concept', value: 22, desc: '函数直接或间接调用自身' },
  { id: '11', name: '哈希表', category: 'structure', value: 26, desc: '键值映射的高效查找结构' },
  { id: '12', name: '最短路径', category: 'algorithm', value: 24, desc: '图中两点间代价最小路径' },
]

const BASE_LINKS: GraphLink[] = [
  { source: '1', target: '2' },
  { source: '1', target: '3' },
  { source: '1', target: '8' },
  { source: '1', target: '11' },
  { source: '3', target: '4' },
  { source: '5', target: '6' },
  { source: '5', target: '7' },
  { source: '5', target: '12' },
  { source: '5', target: '9' },
  { source: '4', target: '10' },
  { source: '8', target: '12' },
  { source: '6', target: '9' },
  { source: '7', target: '10' },
]

/** Mock 知识图谱数据 */
export async function fetchGraphData() {
  return mockSuccess<GraphData>({
    nodes: BASE_NODES.map((n) => ({ ...n })),
    links: BASE_LINKS.map((l) => ({ ...l })),
  })
}

/** Mock 重新生成：随机打乱部分连线 */
export async function regenerateGraphData() {
  const nodes = BASE_NODES.map((n) => ({ ...n, value: 18 + Math.floor(Math.random() * 25) }))
  const links: GraphLink[] = []
  const ids = nodes.map((n) => n.id)

  for (let i = 0; i < 14; i++) {
    const s = ids[Math.floor(Math.random() * ids.length)]
    let t = ids[Math.floor(Math.random() * ids.length)]
    while (t === s) t = ids[Math.floor(Math.random() * ids.length)]
    if (!links.some((l) => (l.source === s && l.target === t) || (l.source === t && l.target === s))) {
      links.push({ source: s, target: t })
    }
  }

  return mockSuccess<GraphData>({ nodes, links })
}
