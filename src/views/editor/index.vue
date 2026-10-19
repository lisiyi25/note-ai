<template>
  <div class="editor-page page-container">
    <div class="top-bar card">
      <el-input
        v-model="form.title"
        class="title-input"
        placeholder="请输入笔记标题"
        maxlength="80"
        show-word-limit
      />
      <el-select v-model="form.category" placeholder="分类" style="width: 140px">
        <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
      </el-select>
      <el-select
        v-model="form.tags"
        multiple
        filterable
        allow-create
        default-first-option
        collapse-tags
        collapse-tags-tooltip
        placeholder="标签"
        style="width: 220px"
      >
        <el-option v-for="t in tagOptions" :key="t" :label="t" :value="t" />
      </el-select>
      <div class="visibility">
        <span>{{ form.isPublic ? '公开' : '私密' }}</span>
        <el-switch v-model="form.isPublic" inline-prompt active-text="公" inactive-text="私" />
      </div>
      <div class="ai-actions">
        <el-button type="warning" plain :icon="MagicStick" :loading="summarizing" @click="aiSummary">
          AI 一键总结
        </el-button>
        <el-button type="success" plain :icon="Share" @click="goGraph">生成知识图谱</el-button>
      </div>
    </div>

    <div class="editor-body card">
      <div class="pane left">
        <div class="pane-title">Markdown 编辑</div>
        <div id="vditor" class="vditor-host"></div>
      </div>
      <div class="pane right">
        <div class="pane-title">实时预览</div>
        <div class="markdown-body preview" v-html="previewHtml"></div>
      </div>
    </div>

    <div class="footer-bar card">
      <el-button :loading="savingDraft" @click="save('draft')">保存草稿</el-button>
      <el-button type="primary" :loading="publishing" @click="save('published')">发布笔记</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Vditor from 'vditor'
import 'vditor/dist/index.css'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
import { MagicStick, Share } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchAiSummary, saveNoteApi } from '@/api/note'

const router = useRouter()
let vditor: Vditor | null = null

const categories = ['数据结构', '算法', '前端', '后端', '随笔']
const tagOptions = ['链表', '树', '二叉树', '图', 'DP', '排序', '哈希']

const form = reactive({
  title: '',
  category: '数据结构',
  tags: ['树'] as string[],
  isPublic: true,
  content: `# 二叉树笔记\n\n## 定义\n\n二叉树是每个节点最多有两个子树的树结构。\n\n\`\`\`ts\ninterface TreeNode {\n  val: number\n  left: TreeNode | null\n  right: TreeNode | null\n}\n\`\`\`\n`,
})

const previewHtml = ref('')
const summarizing = ref(false)
const savingDraft = ref(false)
const publishing = ref(false)

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  highlight(str: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
      } catch {
        /* ignore */
      }
    }
    return `<pre class="hljs"><code>${escapeHtml(str)}</code></pre>`
  },
})

function renderPreview(value: string) {
  form.content = value
  previewHtml.value = md.render(value || '')
}

onMounted(async () => {
  await nextTick()
  vditor = new Vditor('vditor', {
    height: '100%',
    mode: 'ir',
    placeholder: '开始书写你的知识笔记…',
    toolbarConfig: { pin: true },
    cache: { enable: false },
    preview: { delay: 200 },
    value: form.content,
    input: renderPreview,
    after: () => {
      renderPreview(form.content)
    },
  })
})

onBeforeUnmount(() => {
  vditor?.destroy()
  vditor = null
})

async function aiSummary() {
  summarizing.value = true
  try {
    const res = await fetchAiSummary()
    await ElMessageBox.alert(res.data.summary, 'AI 一键总结', {
      confirmButtonText: '知道了',
      customClass: 'ai-summary-box',
    })
  } finally {
    summarizing.value = false
  }
}

function goGraph() {
  ElMessage.success('正在根据笔记内容生成知识图谱…')
  router.push('/graph')
}

async function save(status: 'draft' | 'published') {
  if (!form.title.trim()) {
    ElMessage.warning('请先填写标题')
    return
  }
  const content = vditor?.getValue() || form.content
  if (status === 'draft') savingDraft.value = true
  else publishing.value = true
  try {
    await saveNoteApi({
      title: form.title,
      category: form.category,
      tags: form.tags,
      isPublic: form.isPublic,
      content,
      status,
    })
    ElMessage.success(status === 'draft' ? '草稿已保存' : '笔记发布成功')
  } finally {
    savingDraft.value = false
    publishing.value = false
  }
}
</script>

<style scoped lang="scss">
.editor-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: calc(100vh - 60px);
  max-width: 1400px;
  margin: 0 auto;
}

.top-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;

  .title-input {
    flex: 1;
    min-width: 220px;
  }

  .visibility {
    display: flex;
    align-items: center;
    gap: 8px;
    color: $text-regular;
    font-size: 14px;
  }

  .ai-actions {
    margin-left: auto;
    display: flex;
    gap: 8px;
  }
}

.editor-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow: hidden;
}

.pane {
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid $border-color;

  &:last-child {
    border-right: none;
  }
}

.pane-title {
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  color: $text-secondary;
  border-bottom: 1px solid $border-color;
  background: #fafbfd;
}

.vditor-host {
  flex: 1;
  min-height: 0;

  :deep(.vditor) {
    border: none;
    border-radius: 0;
  }
}

.preview {
  flex: 1;
  overflow: auto;
  padding: 16px 20px;
  background: #fff;
}

.footer-bar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 16px;
}

@media (max-width: 960px) {
  .editor-body {
    grid-template-columns: 1fr;
  }
}
</style>
