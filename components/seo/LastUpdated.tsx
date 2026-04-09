// Renders a "Last updated" stamp at the bottom of public content pages.
// AI engines treat recency as a freshness signal; visible timestamps reinforce it.
interface Props {
  date: string // ISO date, e.g. "2026-04-09"
}

export function LastUpdated({ date }: Props) {
  const formatted = new Date(date).toLocaleDateString('en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  return (
    <p
      style={{
        textAlign: 'center',
        fontSize: 12,
        color: 'rgba(10,22,40,0.35)',
        padding: '24px 24px 48px',
        letterSpacing: '0.02em',
      }}
    >
      Last updated: <time dateTime={date}>{formatted}</time>
    </p>
  )
}
