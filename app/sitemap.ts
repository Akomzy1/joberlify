import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog/get-posts'

const BASE = 'https://joberlify.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts()

  const blogEntries: MetadataRoute.Sitemap = posts.map(post => ({
    url:             `${BASE}/blog/${post.slug}`,
    lastModified:    new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority:        0.7,
  }))

  return [
    {
      url:              `${BASE}/`,
      lastModified:     new Date(),
      changeFrequency:  'weekly',
      priority:         1.0,
    },
    {
      url:              `${BASE}/pricing`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.8,
    },
    {
      url:              `${BASE}/sponsors`,
      lastModified:     new Date(),
      changeFrequency:  'daily',   // register updated ~fortnightly by Home Office
      priority:         0.9,
    },
    {
      url:              `${BASE}/blog`,
      lastModified:     new Date(),
      changeFrequency:  'weekly',
      priority:         0.8,
    },
    {
      url:              `${BASE}/about`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.7,
    },
    {
      url:              `${BASE}/features`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.8,
    },
    {
      url:              `${BASE}/compare`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.8,
    },
    ...blogEntries,
  ]
}
