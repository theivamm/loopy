type Expression = 'happy' | 'loving' | 'sleepy' | 'thinking' | 'waiting' | 'celebrating'

interface LoopyMascotProps {
  colorA?: string
  colorB?: string
  expression?: Expression
  size?: number
}

export function LoopyMascot({
  colorA = '#C9B8FF',
  colorB = '#FFC2A8',
  expression = 'happy',
  size = 120,
}: LoopyMascotProps) {
  const eyes = () => {
    switch (expression) {
      case 'loving':
        return (
          <>
            <path d="M40 54c3-4 9-4 9 1s-9 7-9 7-9-2-9-7 6-5 9-1z" fill="#FF8A70" />
            <path d="M72 54c3-4 9-4 9 1s-9 7-9 7-9-2-9-7 6-5 9-1z" fill="#FF8A70" />
          </>
        )
      case 'sleepy':
        return (
          <>
            <path d="M33 58q7-4 14 0" stroke="#2E2440" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M65 58q7-4 14 0" stroke="#2E2440" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        )
      case 'waiting':
        return (
          <>
            <ellipse cx="46" cy="56" rx="4.5" ry="6" fill="#2E2440" />
            <ellipse cx="74" cy="56" rx="4.5" ry="6" fill="#2E2440" />
          </>
        )
      default:
        return (
          <>
            <ellipse cx="40" cy="56" rx="5" ry="7" fill="#2E2440" />
            <circle cx="41.5" cy="53" r="1.6" fill="#fff" />
            <ellipse cx="72" cy="56" rx="5" ry="7" fill="#2E2440" />
            <circle cx="73.5" cy="53" r="1.6" fill="#fff" />
          </>
        )
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 112 112"
      className={expression === 'sleepy' ? 'opacity-80' : 'animate-[loopy-breathe_4s_ease-in-out_infinite]'}
    >
      <defs>
        <linearGradient id="loopy-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colorA} />
          <stop offset="100%" stopColor={colorB} />
        </linearGradient>
      </defs>
      <path
        d="M56 10c2-6 6-8 8-6s-1 6-3 9c16 3 28 16 28 33 0 20-15 36-36 36S17 66 17 46c0-17 12-30 28-33-2-3-5-7-3-9s6 0 8 6z"
        fill="url(#loopy-body)"
      />
      <circle cx="30" cy="66" r="6" fill="#FFB8D1" opacity="0.6" />
      <circle cx="82" cy="66" r="6" fill="#FFB8D1" opacity="0.6" />
      {eyes()}
      {expression === 'celebrating' && (
        <>
          <circle cx="20" cy="30" r="3" fill="#FFE8A3" />
          <circle cx="92" cy="26" r="3" fill="#FFB8D1" />
          <circle cx="90" cy="60" r="3" fill="#B5EAD7" />
        </>
      )}
    </svg>
  )
}
