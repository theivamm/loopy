import { useId } from 'react'

type Expression = 'happy' | 'loving' | 'sleepy' | 'thinking' | 'waiting' | 'celebrating'

interface LoopyMascotProps {
  colorA?: string
  colorB?: string
  expression?: Expression
  size?: number
  className?: string
}

export function LoopyMascot({
  colorA = '#B9A4FF',
  colorB = '#FFB69A',
  expression = 'happy',
  size = 120,
  className = '',
}: LoopyMascotProps) {
  const uid = useId().replace(/:/g, '')
  const eye = (cx: number, dx = 0, dy = 0) => (
    <g>
      <ellipse cx={cx + dx} cy={56 + dy} rx="5.6" ry="7.6" fill="#2E2440" />
      <circle cx={cx + dx + 1.8} cy={52.6 + dy} r="2.1" fill="#fff" />
      <circle cx={cx + dx - 1.4} cy={59 + dy} r="1" fill="#fff" />
    </g>
  )

  const eyes = () => {
    switch (expression) {
      case 'loving':
        return (
          <>
            <path d="M40 54c3-4 9-4 9 1s-9 7-9 7-9-2-9-7 6-5 9-1z" fill="#FF6F91" />
            <path d="M72 54c3-4 9-4 9 1s-9 7-9 7-9-2-9-7 6-5 9-1z" fill="#FF6F91" />
          </>
        )
      case 'sleepy':
        return (
          <>
            <path d="M33 58q7-5 14 0" stroke="#2E2440" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M65 58q7-5 14 0" stroke="#2E2440" strokeWidth="3" fill="none" strokeLinecap="round" />
            <text x="86" y="26" fontSize="11" fontWeight="700" fill="#7C5CDB" fontFamily="Fraunces,serif">z</text>
            <text x="95" y="16" fontSize="8" fontWeight="700" fill="#7C5CDB" fontFamily="Fraunces,serif">z</text>
          </>
        )
      case 'waiting':
        return (
          <g style={{ transformOrigin: '56px 56px', animation: 'loopy-blink 5s infinite' }}>
            {eye(40, 4)}
            {eye(72, 4)}
          </g>
        )
      case 'thinking':
        return (
          <g style={{ transformOrigin: '56px 56px', animation: 'loopy-blink 5s infinite' }}>
            {eye(40, 3, -3)}
            {eye(72, 3, -3)}
          </g>
        )
      default:
        return (
          <g style={{ transformOrigin: '56px 56px', animation: 'loopy-blink 5s infinite' }}>
            {eye(40)}
            {eye(72)}
          </g>
        )
    }
  }

  const mouth =
    expression === 'celebrating' ? (
      <path d="M49 66q7 9 14 0z" fill="#C7603F" />
    ) : expression === 'sleepy' ? (
      <circle cx="56" cy="70" r="2.2" fill="#C7603F" />
    ) : expression === 'thinking' ? (
      <path d="M52 69h8" stroke="#C7603F" strokeWidth="2.4" strokeLinecap="round" />
    ) : (
      <path d="M51 68q5 5 10 0" stroke="#C7603F" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    )

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 112 112"
      className={`overflow-visible ${className}`}
      style={{
        animation: expression === 'sleepy' ? undefined : 'loopy-breathe 4s ease-in-out infinite',
        filter: 'drop-shadow(0 8px 12px rgba(124,92,219,.25))',
      }}
      role="img"
      aria-label="Loopy"
    >
      <defs>
        <linearGradient id={`b${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={colorA} />
          <stop offset="1" stopColor={colorB} />
        </linearGradient>
        <radialGradient id={`l${uid}`} cx=".3" cy=".25" r=".6">
          <stop offset="0" stopColor="#fff" stopOpacity=".75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id={`f${uid}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" />
        </filter>
      </defs>
      <g filter={`url(#f${uid})`}>
        <path
          d="M56 10c2-6 6-8 8-6s-1 6-3 9c16 3 28 16 28 33 0 20-15 36-36 36S17 66 17 46c0-17 12-30 28-33-2-3-5-7-3-9s6 0 8 6z"
          fill={`url(#b${uid})`}
        />
        <path d="M22 40c16 8 52 6 70-6M19 54c20 10 56 8 76-6M24 68c16 8 44 6 62-4" stroke="#fff" strokeOpacity=".28" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M30 24c10 18 34 40 58 38" stroke="#FFC2A8" strokeOpacity=".5" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </g>
      <path d="M17 46c0-17 12-30 28-33h22c16 3 28 16 28 33 0 20-15 36-36 36S17 66 17 46z" fill={`url(#l${uid})`} />
      {eyes()}
      <circle cx="29" cy="67" r="7" fill="#FF9FBF" opacity=".65" />
      <circle cx="83" cy="67" r="7" fill="#FF9FBF" opacity=".65" />
      {mouth}
      {expression === 'celebrating' && (
        <>
          <circle cx="14" cy="26" r="3" fill="#FFE8A3" />
          <circle cx="98" cy="22" r="3" fill="#FFB8D1" />
          <circle cx="102" cy="58" r="3" fill="#B5EAD7" />
          <circle cx="8" cy="60" r="2.5" fill="#B8DCFF" />
        </>
      )}
    </svg>
  )
}
