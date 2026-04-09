'use client'

export function ClientDate() {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <p className="text-sm text-[#0A1628]/45 mt-0.5">
      {today}
    </p>
  )
}
