export function Blobs() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-32 left-[15%] h-[460px] w-[460px] rounded-full bg-lavender opacity-45 blur-[90px]" style={{ animation: 'loopy-drift 26s ease-in-out infinite' }} />
      <div className="absolute right-[-120px] top-[30%] h-[420px] w-[420px] rounded-full bg-peach opacity-40 blur-[90px]" style={{ animation: 'loopy-drift 30s ease-in-out infinite reverse' }} />
      <div className="absolute bottom-[-160px] left-[30%] h-[440px] w-[440px] rounded-full bg-blush opacity-35 blur-[90px]" style={{ animation: 'loopy-drift 34s ease-in-out infinite' }} />
    </div>
  )
}
