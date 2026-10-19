<template>
  <div class="detail-page page-container" v-loading="loading">
    <div class="detail-layout" v-if="note">
      <aside class="toc card">
        <h4>目录</h4>
        <nav>
          <a
            v-for="item in toc"
            :key="item.id"
            :href="`#${item.id}`"
            :class="['toc-item', `level-${item.level}`]"
            @click.prevent="scrollTo(item.id)"
          >
            {{ item.text }}
          </a>
        </nav>
      </aside>

      <article class="content card">
        <header class="note-header">
          <h1>{{ note.title }}</h1>
          <div class="meta">
            <div class="avatar-wrap">
              <el-avatar :size="32" :src="note.author.avatar" />
              <span class="verified">V</span>
            </div>
            <span>{{ note.author.name }}</span>
            <el-divider direction="vertical" />
            <span>{{ formatDate(note.createdAt) }}</span>
            <el-divider direction="vertical" />
            <span v-for="tag in note.tags" :key="tag" class="capsule-tag">{{ tag }}</span>
          </div>
        </header>
        <div class="markdown-body" v-html="html"></div>
        <p class="ai-hint">需要 AI 帮忙？点击右下角 NoteAI Copilot ✨</p>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
import { fetchNoteDetail, type NoteItem } from '@/api/note'

interface TocItem {
  id: string
  text: string
  level: number
}

const route = useRoute()
const loading = ref(true)
const note = ref<NoteItem | null>(null)
const html = ref('')
const toc = ref<TocItem[]>([])

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

const noteId = computed(() => route.params.id as string)

function slugify(text: string, idx: number) {
  return `heading-${idx}-${text.trim().toLowerCase().replace(/\s+/g, '-')}`
}

function renderWithToc(content: string) {
  const items: TocItem[] = []
  let idx = 0
  const rendered = md.render(content)
  const withIds = rendered.replace(
    /<h([2-3])>(.*?)<\/h\1>/g,
    (_m: string, level: string, text: string) => {
      const plain = text.replace(/<[^>]+>/g, '')
      const id = slugify(plain, idx++)
      items.push({ id, text: plain, level: Number(level) })
      return `<h${level} id="${id}">${text}</h${level}>`
    },
  )
  toc.value = items
  html.value = withIds
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-CN')
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(async () => {
  try {
    const res = await fetchNoteDetail(noteId.value)
    note.value = res.data
    renderWithToc(res.data.content)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.detail-page {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 60px);
}

.detail-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 18px;
  align-items: start;
}

.toc {
  position: sticky;
  top: 16px;
  padding: 16px;
  max-height: calc(100vh - 100px);
  overflow: auto;

  h4 {
    margin-bottom: 12px;
    font-size: 14px;
    color: $text-primary;
  }

  nav {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.toc-item {
  font-size: 13px;
  color: $text-regular;
  line-height: 1.4;
  transition: color 0.2s;

  &:hover {
    color: $primary;
  }

  &.level-3 {
    padding-left: 12px;
    font-size: 12px;
    color: $text-secondary;
  }
}

.content {
  padding: 28px 32px 40px;
}

.note-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid $border-color;

  h1 {
    font-size: 28px;
    margin-bottom: 14px;
    color: $text-primary;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    color: $text-secondary;
    font-size: 13px;
  }
}

.avatar-wrap {
  position: relative;
  width: 32px;
  height: 32px;
}

.verified {
  position: absolute;
  right: -3px;
  bottom: -2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #1677ff;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #fff;
}

.capsule-tag {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  background: #e6f4ff;
  color: #0958d9;
}

.ai-hint {
  margin-top: 28px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f0f5ff;
  color: #3b5bdb;
  font-size: 13px;
}

@media (max-width: 900px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }

  .toc {
    position: static;
    max-height: none;
  }
}
</style>
