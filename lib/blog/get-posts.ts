import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const readingTime = require('reading-time') as (text: string) => { text: string; minutes: number }

// ─── Types ────────────────────────────────────────────────────────────────────

export type BlogCategory =
  | 'Job Search'
  | 'Visa Sponsorship'
  | 'CV & Resume'
  | 'Interview Prep'
  | 'Career Growth'

export interface BlogPost {
  slug:        string
  title:       string
  excerpt:     string
  date:        string          // ISO date string e.g. "2026-04-01"
  category:    BlogCategory
  author:      string
  authorRole?: string
  keywords:    string[]
  readTime:    string          // e.g. "8 min read"
  content:     string          // raw MDX source
}

// ─── Paths ────────────────────────────────────────────────────────────────────

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseMdx(slug: string): BlogPost {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`)
  const raw      = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  const stats = readingTime(content)

  return {
    slug,
    title:      data.title      as string,
    excerpt:    data.excerpt    as string,
    date:       data.date       as string,
    category:   data.category   as BlogCategory,
    author:     data.author     as string,
    authorRole: data.authorRole as string | undefined,
    keywords:   (data.keywords  as string[]) ?? [],
    readTime:   stats.text,
    content,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Return all posts sorted newest-first */
export function getAllPosts(): BlogPost[] {
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'))
  const posts = files.map(f => parseMdx(f.replace(/\.mdx$/, '')))
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1))
}

/** Return a single post by slug, or null if not found */
export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null
  return parseMdx(slug)
}

/** Return posts in a given category, sorted newest-first */
export function getPostsByCategory(category: BlogCategory): BlogPost[] {
  return getAllPosts().filter(p => p.category === category)
}

/** Return related posts (same category, excluding current slug) */
export function getRelatedPosts(slug: string, category: BlogCategory, limit = 3): BlogPost[] {
  return getAllPosts()
    .filter(p => p.category === category && p.slug !== slug)
    .slice(0, limit)
}

/** Extract headings from MDX source for ToC generation */
export interface TocHeading {
  level: 2 | 3
  text:  string
  id:    string
}

export function extractToc(content: string): TocHeading[] {
  const lines = content.split('\n')
  const toc: TocHeading[] = []
  for (const line of lines) {
    const h2 = line.match(/^## (.+)$/)
    const h3 = line.match(/^### (.+)$/)
    if (h2) {
      toc.push({ level: 2, text: h2[1].trim(), id: slugify(h2[1].trim()) })
    } else if (h3) {
      toc.push({ level: 3, text: h3[1].trim(), id: slugify(h3[1].trim()) })
    }
  }
  return toc
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
