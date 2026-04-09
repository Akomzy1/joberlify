import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts, getPostsByCategory } from '@/lib/blog/get-posts'
import type { BlogCategory } from '@/lib/blog/get-posts'
import { JsonLd } from '@/components/seo/JsonLd'
import { LastUpdated } from '@/components/seo/LastUpdated'

// ─── SEO ──────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Blog — Job Search Tips, Visa Guides & Career Intelligence',
  description:
    'Practical guides on AI job search tools, UK visa sponsorship, ATS-optimised CVs, interview preparation, and smart career strategy. Researched, honest, and updated regularly.',
  alternates: { canonical: 'https://joberlify.com/blog' },
  openGraph: {
    title:       'Joberlify Blog — Job Search Tips, Visa Guides & Career Intelligence',
    description: 'In-depth guides on UK visa sponsorship, ATS CVs, job fit scoring, and smart job search strategy.',
    url:         'https://joberlify.com/blog',
    type:        'website',
  },
}

const BLOG_LIST_SCHEMA = {
  '@context': 'https://schema.org',
  '@type':    'Blog',
  name:        'Joberlify Blog',
  url:         'https://joberlify.com/blog',
  description: 'Practical guides on AI job search, UK visa sponsorship, CV writing, and career strategy.',
  publisher: {
    '@type': 'Organization',
    name:    'Joberlify',
    url:     'https://joberlify.com',
  },
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: BlogCategory[] = [
  'Job Search',
  'Visa Sponsorship',
  'CV & Resume',
  'Interview Prep',
  'Career Growth',
]

const CATEGORY_COLORS: Record<BlogCategory, { bg: string; text: string }> = {
  'Job Search':      { bg: '#EFF6FF', text: '#1D4ED8' },
  'Visa Sponsorship':{ bg: '#F0FDF4', text: '#15803D' },
  'CV & Resume':     { bg: '#FFF7ED', text: '#C2410C' },
  'Interview Prep':  { bg: '#FDF4FF', text: '#7E22CE' },
  'Career Growth':   { bg: '#FFFBEB', text: '#B45309' },
}

const POSTS_PER_PAGE = 9

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  searchParams: Promise<{ category?: string; page?: string }>
}

export default async function BlogIndexPage({ searchParams }: Props) {
  const params   = await searchParams
  const category = CATEGORIES.find(c => c === params.category) ?? null
  const page     = Math.max(1, parseInt(params.page ?? '1', 10))

  const allPosts = category ? getPostsByCategory(category) : getAllPosts()
  const total    = allPosts.length
  const totalPages = Math.ceil(total / POSTS_PER_PAGE)
  const posts    = allPosts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE)

  return (
    <>
      <JsonLd schema={BLOG_LIST_SCHEMA} />

      <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8' }}>

        {/* ── Hero ── */}
        <div style={{ backgroundColor: '#0A1628', color: '#FAFAF8' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '56px 24px 48px' }}>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: '#0EA5E9', marginBottom: 16,
            }}>
              Intelligence & Guides
            </p>
            <h1 style={{
              fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800,
              letterSpacing: '-0.02em', lineHeight: 1.1,
              marginBottom: 16, maxWidth: 600,
            }}>
              Job Search Intelligence
            </h1>
            <p style={{
              fontSize: 17, color: 'rgba(250,250,248,0.60)',
              lineHeight: 1.6, maxWidth: 520,
            }}>
              Practical guides on AI job search, UK visa sponsorship, ATS-optimised
              CVs, and smart career strategy. No fluff.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>

          {/* ── Category filters ── */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 40 }}>
            <Link
              href="/blog"
              style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                textDecoration: 'none', transition: 'all 0.15s',
                backgroundColor: !category ? '#0A1628' : 'white',
                color:           !category ? '#FAFAF8' : '#0A1628',
                border:          !category ? '1px solid #0A1628' : '1px solid #E8E4DD',
              }}
            >
              All
            </Link>
            {CATEGORIES.map(cat => {
              const active = category === cat
              return (
                <Link
                  key={cat}
                  href={`/blog?category=${encodeURIComponent(cat)}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                    textDecoration: 'none', transition: 'all 0.15s',
                    backgroundColor: active ? '#0A1628' : 'white',
                    color:           active ? '#FAFAF8' : '#0A1628',
                    border:          active ? '1px solid #0A1628' : '1px solid #E8E4DD',
                  }}
                >
                  {cat}
                </Link>
              )
            })}
          </div>

          {/* ── Results count ── */}
          <p style={{ fontSize: 13, color: '#0A1628', opacity: 0.45, marginBottom: 28 }}>
            {total} article{total !== 1 ? 's' : ''}
            {category ? ` in ${category}` : ''}
            {totalPages > 1 ? ` — page ${page} of ${totalPages}` : ''}
          </p>

          {/* ── Post grid ── */}
          {posts.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 24,
              marginBottom: 48,
            }}>
              {posts.map(post => {
                const colors = CATEGORY_COLORS[post.category]
                return (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <article style={{
                      backgroundColor: 'white',
                      border: '1px solid #E8E4DD',
                      borderRadius: 16,
                      padding: '24px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'box-shadow 0.2s, border-color 0.2s',
                    }}>
                      {/* Category badge */}
                      <span style={{
                        display: 'inline-flex',
                        alignSelf: 'flex-start',
                        padding: '3px 10px',
                        borderRadius: 999,
                        fontSize: 11, fontWeight: 700,
                        letterSpacing: '0.05em',
                        backgroundColor: colors.bg,
                        color: colors.text,
                        marginBottom: 14,
                      }}>
                        {post.category}
                      </span>

                      {/* Title */}
                      <h2 style={{
                        fontSize: 17, fontWeight: 700,
                        color: '#0A1628', lineHeight: 1.35,
                        marginBottom: 10, flex: 1,
                      }}>
                        {post.title}
                      </h2>

                      {/* Excerpt */}
                      <p style={{
                        fontSize: 14, color: 'rgba(10,22,40,0.60)',
                        lineHeight: 1.6, marginBottom: 20,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical' as const,
                        overflow: 'hidden',
                      }}>
                        {post.excerpt}
                      </p>

                      {/* Meta */}
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 12, color: 'rgba(10,22,40,0.40)',
                        borderTop: '1px solid #F0EDE8',
                        paddingTop: 14, marginTop: 'auto',
                      }}>
                        <time dateTime={post.date}>
                          {new Date(post.date).toLocaleDateString('en-GB', {
                            year: 'numeric', month: 'short', day: 'numeric',
                          })}
                        </time>
                        <span>{post.readTime}</span>
                      </div>
                    </article>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p style={{ color: 'rgba(10,22,40,0.45)', fontSize: 15, padding: '40px 0' }}>
              No articles in this category yet.
            </p>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {page > 1 && (
                <Link
                  href={`/blog?${category ? `category=${encodeURIComponent(category)}&` : ''}page=${page - 1}`}
                  style={paginationStyle(false)}
                >
                  ← Previous
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Link
                  key={p}
                  href={`/blog?${category ? `category=${encodeURIComponent(category)}&` : ''}page=${p}`}
                  style={paginationStyle(p === page)}
                >
                  {p}
                </Link>
              ))}
              {page < totalPages && (
                <Link
                  href={`/blog?${category ? `category=${encodeURIComponent(category)}&` : ''}page=${page + 1}`}
                  style={paginationStyle(false)}
                >
                  Next →
                </Link>
              )}
            </div>
          )}
          <LastUpdated date="2026-04-09" />
        </div>
      </div>
    </>
  )
}

function paginationStyle(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minWidth: 40, height: 40, padding: '0 12px',
    borderRadius: 10, fontSize: 14, fontWeight: active ? 700 : 500,
    textDecoration: 'none', transition: 'all 0.15s',
    backgroundColor: active ? '#0A1628' : 'white',
    color:           active ? '#FAFAF8' : '#0A1628',
    border:          active ? '1px solid #0A1628' : '1px solid #E8E4DD',
  }
}
