import { ImageResponse } from 'next/og'

export const runtime     = 'edge'
export const alt         = 'Joberlify — AI-Powered Job Search Intelligence'
export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

// ─── Branded OG image ─────────────────────────────────────────────────────────
// Navy-950 background, Clash Display–style bold typography, teal accents.
// Served automatically at /opengraph-image and referenced by Next.js
// in every page's og:image unless a page overrides it.

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display:         'flex',
          flexDirection:   'column',
          width:           '100%',
          height:          '100%',
          backgroundColor: '#0A1628',
          position:        'relative',
          fontFamily:      'system-ui, -apple-system, sans-serif',
          overflow:        'hidden',
        }}
      >
        {/* Subtle grid texture */}
        <div
          style={{
            position:        'absolute',
            inset:           0,
            backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(14,165,233,0.08) 0%, transparent 60%)',
          }}
        />

        {/* Teal top accent bar */}
        <div
          style={{
            position:        'absolute',
            top:             0,
            left:            0,
            right:           0,
            height:          4,
            backgroundColor: '#0EA5E9',
          }}
        />

        {/* Content */}
        <div
          style={{
            display:       'flex',
            flexDirection: 'column',
            flex:          1,
            padding:       '60px 64px',
          }}
        >
          {/* Wordmark */}
          <div
            style={{
              display:       'flex',
              alignItems:    'center',
              gap:           10,
              marginBottom:  'auto',
            }}
          >
            <div
              style={{
                fontSize:      28,
                fontWeight:    800,
                color:         '#FAFAF8',
                letterSpacing: '0.04em',
              }}
            >
              Joberlify
            </div>
            <div
              style={{
                fontSize:        11,
                fontWeight:      700,
                color:           '#0EA5E9',
                textTransform:   'uppercase',
                letterSpacing:   '0.12em',
                backgroundColor: 'rgba(14,165,233,0.12)',
                padding:         '4px 10px',
                borderRadius:    4,
                marginLeft:      4,
              }}
            >
              AI Job Search
            </div>
          </div>

          {/* Headline */}
          <div
            style={{
              display:       'flex',
              flexDirection: 'column',
              marginTop:     48,
            }}
          >
            <div
              style={{
                fontSize:      62,
                fontWeight:    800,
                color:         '#FAFAF8',
                lineHeight:    1.08,
                letterSpacing: '-0.02em',
                marginBottom:  20,
                maxWidth:      700,
              }}
            >
              AI-Powered Job Search Intelligence
            </div>
            <div
              style={{
                fontSize:   22,
                color:      'rgba(250,250,248,0.55)',
                lineHeight: 1.5,
                maxWidth:   560,
              }}
            >
              Score fit across 10 dimensions. Generate tailored CVs. Navigate UK visa sponsorship.
            </div>
          </div>

          {/* Stat badges */}
          <div
            style={{
              display:   'flex',
              gap:       12,
              marginTop: 48,
            }}
          >
            {[
              '10 Scoring Dimensions',
              '120,000+ UK Sponsors',
              '350+ Occupation Codes',
            ].map((label) => (
              <div
                key={label}
                style={{
                  display:         'flex',
                  alignItems:      'center',
                  backgroundColor: 'rgba(250,250,248,0.07)',
                  border:          '1px solid rgba(250,250,248,0.12)',
                  borderRadius:    8,
                  padding:         '8px 16px',
                  fontSize:        14,
                  fontWeight:      600,
                  color:           'rgba(250,250,248,0.70)',
                  letterSpacing:   '0.01em',
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom teal border */}
        <div
          style={{
            position:        'absolute',
            bottom:          0,
            left:            0,
            right:           0,
            height:          4,
            backgroundColor: '#0EA5E9',
          }}
        />

        {/* Right decorative element — abstract radar */}
        <div
          style={{
            position:        'absolute',
            right:           -60,
            top:             '50%',
            transform:       'translateY(-50%)',
            width:           380,
            height:          380,
            borderRadius:    '50%',
            border:          '1px solid rgba(14,165,233,0.2)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
          }}
        >
          <div
            style={{
              width:        280,
              height:       280,
              borderRadius: '50%',
              border:       '1px solid rgba(14,165,233,0.15)',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width:           180,
                height:          180,
                borderRadius:    '50%',
                border:          '1px solid rgba(14,165,233,0.12)',
                backgroundColor: 'rgba(14,165,233,0.05)',
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
