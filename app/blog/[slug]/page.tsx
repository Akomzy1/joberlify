import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { compileMDX } from 'next-mdx-remote/rsc'
import { getAllPosts, getPostBySlug, getRelatedPosts, extractToc } from '@/lib/blog/get-posts'
import { JsonLd } from '@/components/seo/JsonLd'

// ─── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return getAllPosts().map(p => ({ slug: p.slug }))
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  return {
    title:       post.title,
    description: post.excerpt,
    keywords:    post.keywords,
    authors:     [{ name: post.author }],
    alternates:  { canonical: `https://joberlify.com/blog/${slug}` },
    openGraph: {
      title:           post.title,
      description:     post.excerpt,
      url:             `https://joberlify.com/blog/${slug}`,
      type:            'article',
      publishedTime:   post.date,
      authors:         [post.author],
      tags:            post.keywords,
    },
  }
}

// ─── MDX component overrides ─────────────────────────────────────────────────
// Inject id props on headings so ToC anchor links work.

function headingSlug(text: unknown): string {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

const MDX_COMPONENTS = {
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      id={headingSlug(typeof children === 'string' ? children : '')}
      {...props}
      style={{
        fontSize: 22, fontWeight: 700, color: '#0A1628',
        marginTop: 40, marginBottom: 12, lineHeight: 1.3,
        scrollMarginTop: 88,
      }}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      id={headingSlug(typeof children === 'string' ? children : '')}
      {...props}
      style={{
        fontSize: 18, fontWeight: 600, color: '#0A1628',
        marginTop: 28, marginBottom: 8, lineHeight: 1.4,
        scrollMarginTop: 88,
      }}
    >
      {children}
    </h3>
  ),
  p: ({ children }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p style={{
      fontSize: 16, lineHeight: 1.8, color: 'rgba(10,22,40,0.80)',
      marginBottom: 20,
    }}>
      {children}
    </p>
  ),
  strong: ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <strong style={{ fontWeight: 700, color: '#0A1628' }}>{children}</strong>
  ),
  ul: ({ children }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul style={{ paddingLeft: 20, marginBottom: 20, listStyleType: 'disc' }}>
      {children}
    </ul>
  ),
  ol: ({ children }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol style={{ paddingLeft: 20, marginBottom: 20, listStyleType: 'decimal' }}>
      {children}
    </ol>
  ),
  li: ({ children }: React.HTMLAttributes<HTMLLIElement>) => (
    <li style={{
      fontSize: 16, lineHeight: 1.75, color: 'rgba(10,22,40,0.80)',
      marginBottom: 6,
    }}>
      {children}
    </li>
  ),
  blockquote: ({ children }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote style={{
      borderLeft: '3px solid #0EA5E9',
      paddingLeft: 20, margin: '28px 0',
      color: 'rgba(10,22,40,0.65)',
      fontStyle: 'italic', fontSize: 17, lineHeight: 1.7,
    }}>
      {children}
    </blockquote>
  ),
  table: ({ children }: React.HTMLAttributes<HTMLTableElement>) => (
    <div style={{ overflowX: 'auto', marginBottom: 28 }}>
      <table style={{
        width: '100%', borderCollapse: 'collapse',
        fontSize: 14, lineHeight: 1.6,
      }}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead style={{ backgroundColor: '#F5F2ED' }}>{children}</thead>
  ),
  th: ({ children }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th style={{
      padding: '10px 16px', textAlign: 'left',
      fontWeight: 700, color: '#0A1628', fontSize: 13,
      borderBottom: '2px solid #E8E4DD',
    }}>
      {children}
    </th>
  ),
  td: ({ children }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td style={{
      padding: '10px 16px', color: 'rgba(10,22,40,0.75)',
      borderBottom: '1px solid #F0EDE8',
    }}>
      {children}
    </td>
  ),
  a: ({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      href={href}
      style={{ color: '#0EA5E9', textDecoration: 'underline', textUnderlineOffset: 3 }}
    >
      {children}
    </a>
  ),
  hr: () => (
    <hr style={{ border: 'none', borderTop: '1px solid #E8E4DD', margin: '36px 0' }} />
  ),
  code: ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <code style={{
      backgroundColor: '#F5F2ED', padding: '2px 6px',
      borderRadius: 4, fontSize: '0.88em',
      fontFamily: "'JetBrains Mono', monospace",
      color: '#0A1628',
    }}>
      {children}
    </code>
  ),
}

// ─── Category colours ─────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  'Job Search':       { bg: '#EFF6FF', text: '#1D4ED8' },
  'Visa Sponsorship': { bg: '#F0FDF4', text: '#15803D' },
  'CV & Resume':      { bg: '#FFF7ED', text: '#C2410C' },
  'Interview Prep':   { bg: '#FDF4FF', text: '#7E22CE' },
  'Career Growth':    { bg: '#FFFBEB', text: '#B45309' },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ slug: string }>
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post     = getPostBySlug(slug)
  if (!post) notFound()

  const related = getRelatedPosts(slug, post.category, 3)
  const toc     = extractToc(post.content)

  const { content } = await compileMDX({
    source:     post.content,
    components: MDX_COMPONENTS as Parameters<typeof compileMDX>[0]['components'],
    options:    { parseFrontmatter: false },
  })

  const articleSchema = {
    '@context':     'https://schema.org',
    '@type':        'Article',
    headline:       post.title,
    description:    post.excerpt,
    url:            `https://joberlify.com/blog/${slug}`,
    datePublished:  post.date,
    dateModified:   post.date,
    author: {
      '@type': 'Organization',
      name:    post.author,
      url:     'https://joberlify.com',
    },
    publisher: {
      '@type': 'Organization',
      name:    'Joberlify',
      url:     'https://joberlify.com',
      logo: {
        '@type': 'ImageObject',
        url:     'https://joberlify.com/logo.png',
      },
    },
    keywords:      post.keywords.join(', '),
    articleSection: post.category,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id':   `https://joberlify.com/blog/${slug}`,
    },
  }

  const catColors = CAT_COLORS[post.category] ?? { bg: '#F5F2ED', text: '#0A1628' }

  return (
    <>
      <JsonLd schema={articleSchema} />

      <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8' }}>

        {/* ── Breadcrumb ── */}
        <div style={{ borderBottom: '1px solid #E8E4DD', backgroundColor: 'white' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '12px 24px' }}>
            <nav style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
              <Link href="/" style={{ color: '#0EA5E9', textDecoration: 'none' }}>Joberlify</Link>
              <span style={{ color: 'rgba(10,22,40,0.30)' }}>/</span>
              <Link href="/blog" style={{ color: '#0EA5E9', textDecoration: 'none' }}>Blog</Link>
              <span style={{ color: 'rgba(10,22,40,0.30)' }}>/</span>
              <span style={{ color: 'rgba(10,22,40,0.50)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
                {post.title}
              </span>
            </nav>
          </div>
        </div>

        {/* ── Hero ── */}
        <div style={{ backgroundColor: '#0A1628', color: '#FAFAF8' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 44px' }}>
            <span style={{
              display: 'inline-block',
              padding: '3px 12px', borderRadius: 999,
              fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
              backgroundColor: catColors.bg, color: catColors.text,
              marginBottom: 18,
            }}>
              {post.category}
            </span>
            <h1 style={{
              fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800,
              letterSpacing: '-0.02em', lineHeight: 1.15,
              marginBottom: 16, maxWidth: 700,
            }}>
              {post.title}
            </h1>
            <p style={{
              fontSize: 18, color: 'rgba(250,250,248,0.60)',
              lineHeight: 1.6, maxWidth: 620, marginBottom: 28,
            }}>
              {post.excerpt}
            </p>
            <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'rgba(250,250,248,0.45)' }}>
              <span>{post.author}</span>
              <span>·</span>
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('en-GB', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </time>
              <span>·</span>
              <span>{post.readTime}</span>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
          <div style={{ display: 'flex', gap: 48, alignItems: 'flex-start', paddingTop: 48 }}>

            {/* Article content */}
            <article style={{ flex: 1, minWidth: 0 }}>
              {content}

              {/* ── Author section ── */}
              <div style={{
                marginTop: 52, paddingTop: 32,
                borderTop: '1px solid #E8E4DD',
                display: 'flex', gap: 16, alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  backgroundColor: '#0EA5E9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, flexShrink: 0,
                }}>
                  J
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#0A1628', marginBottom: 4 }}>
                    {post.author}
                  </p>
                  {post.authorRole && (
                    <p style={{ fontSize: 13, color: 'rgba(10,22,40,0.50)', marginBottom: 8 }}>
                      {post.authorRole}
                    </p>
                  )}
                  <p style={{ fontSize: 14, color: 'rgba(10,22,40,0.60)', lineHeight: 1.6, maxWidth: 480 }}>
                    Joberlify&apos;s editorial team writes evidence-based guides on job search strategy,
                    UK visa sponsorship, and career intelligence. We use the same research that powers
                    Joberlify&apos;s AI evaluation engine.
                  </p>
                </div>
              </div>

              {/* ── CTA ── */}
              <div style={{
                marginTop: 40,
                backgroundColor: '#0A1628',
                borderRadius: 16,
                padding: '32px 28px',
                color: '#FAFAF8',
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0EA5E9', marginBottom: 10 }}>
                  Put it into practice
                </p>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10, lineHeight: 1.3 }}>
                  Evaluate your job fit with AI — free
                </h3>
                <p style={{ fontSize: 15, color: 'rgba(250,250,248,0.60)', marginBottom: 22, lineHeight: 1.6, maxWidth: 440 }}>
                  Score any job description against your profile across 10 dimensions.
                  Three evaluations free every month. No card required.
                </p>
                <Link
                  href="/auth/signup"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    backgroundColor: '#0EA5E9', color: 'white',
                    padding: '12px 22px', borderRadius: 10,
                    fontSize: 15, fontWeight: 700, textDecoration: 'none',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Try Joberlify Free →
                </Link>
              </div>
            </article>

            {/* ── Sidebar: ToC ── */}
            {toc.length > 0 && (
              <aside style={{
                width: 220, flexShrink: 0,
                position: 'sticky', top: 88,
                display: 'none',
              }}
                className="blog-toc-sidebar"
              >
                <p style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: '#0EA5E9', marginBottom: 14,
                }}>
                  Contents
                </p>
                <nav>
                  {toc.map(item => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      style={{
                        display: 'block',
                        fontSize: item.level === 2 ? 13 : 12,
                        fontWeight: item.level === 2 ? 600 : 400,
                        color: 'rgba(10,22,40,0.60)',
                        textDecoration: 'none',
                        paddingLeft: item.level === 3 ? 12 : 0,
                        paddingTop: 6, paddingBottom: 6,
                        lineHeight: 1.4,
                        borderLeft: item.level === 2 ? '2px solid #E8E4DD' : '2px solid transparent',
                        paddingInlineStart: item.level === 2 ? 12 : 24,
                        transition: 'color 0.15s, border-color 0.15s',
                      }}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </aside>
            )}
          </div>

          {/* ── Related posts ── */}
          {related.length > 0 && (
            <section style={{ marginTop: 64 }}>
              <h2 style={{
                fontSize: 20, fontWeight: 800, color: '#0A1628',
                marginBottom: 24, letterSpacing: '-0.01em',
              }}>
                Related Articles
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 20,
              }}>
                {related.map(rel => {
                  const rc = CAT_COLORS[rel.category] ?? { bg: '#F5F2ED', text: '#0A1628' }
                  return (
                    <Link
                      key={rel.slug}
                      href={`/blog/${rel.slug}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <article style={{
                        backgroundColor: 'white',
                        border: '1px solid #E8E4DD',
                        borderRadius: 14, padding: '20px',
                        height: '100%',
                      }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px', borderRadius: 999,
                          fontSize: 11, fontWeight: 700,
                          backgroundColor: rc.bg, color: rc.text,
                          marginBottom: 10,
                        }}>
                          {rel.category}
                        </span>
                        <h3 style={{
                          fontSize: 15, fontWeight: 700, color: '#0A1628',
                          lineHeight: 1.4, marginBottom: 8,
                        }}>
                          {rel.title}
                        </h3>
                        <p style={{ fontSize: 12, color: 'rgba(10,22,40,0.45)' }}>
                          {rel.readTime}
                        </p>
                      </article>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Inline CSS for ToC sidebar responsive visibility */}
      <style>{`
        @media (min-width: 900px) {
          .blog-toc-sidebar { display: block !important; }
        }
      `}</style>
    </>
  )
}
