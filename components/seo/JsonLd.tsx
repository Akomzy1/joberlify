/**
 * Reusable JSON-LD structured data component.
 * Renders a <script type="application/ld+json"> tag that AI crawlers
 * and search engines use to understand and cite page content.
 *
 * Usage:
 *   <JsonLd schema={{ '@context': 'https://schema.org', '@type': 'Organization', ... }} />
 */
interface JsonLdProps {
  schema: Record<string, unknown>
}

export function JsonLd({ schema }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 0) }}
    />
  )
}
