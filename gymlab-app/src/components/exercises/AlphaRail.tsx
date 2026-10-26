// Rail vertical A–Z (patrón agenda iOS): slider continuo que salta a la letra tocada.
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface AlphaRailProps {
  alphabet: string[]
  activeLetter: string
  presentLetters: ReadonlySet<string>
  onJump: (letter: string) => void
}

export const AlphaRail = ({ alphabet, activeLetter, presentLetters, onJump }: AlphaRailProps) => {
  const { t } = useTranslation()
  const railRef = useRef<HTMLDivElement | null>(null)
  const [hoverLetter, setHoverLetter] = useState<string | null>(null)
  const pendingRef = useRef(0)

  // Mapea la Y del puntero a una letra del abecedario (incluye las inertes para mantener el slider estable).
  const letterAt = useCallback(
    (clientY: number): string => {
      const el = railRef.current
      if (!el || alphabet.length === 0) return alphabet[0] ?? ''
      const rect = el.getBoundingClientRect()
      const ratio = (clientY - rect.top) / rect.height
      const index = Math.round(ratio * (alphabet.length - 1))
      return alphabet[Math.max(0, Math.min(alphabet.length - 1, index))]
    },
    [alphabet],
  )

  const commitJump = useCallback(
    (letter: string) => {
      if (presentLetters.has(letter)) onJump(letter)
    },
    [presentLetters, onJump],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      const letter = letterAt(e.clientY)
      setHoverLetter(letter)
      commitJump(letter)
    },
    [letterAt, commitJump],
  )

  // Durante el arrastre «empuja» el scroll hacia la letra (con un throttle por rAF).
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const letter = letterAt(e.clientY)
      if (!letter || letter === hoverLetter) return
      setHoverLetter(letter)
      cancelAnimationFrame(pendingRef.current)
      pendingRef.current = requestAnimationFrame(() => commitJump(letter))
    },
    [letterAt, hoverLetter, commitJump],
  )

  const handlePointerEnd = useCallback(() => {
    cancelAnimationFrame(pendingRef.current)
    setHoverLetter(null)
  }, [])

  return (
    <div
      ref={railRef}
      role="navigation"
      aria-label={t('ejercicios.indiceLetras')}
      className="fixed right-0.5 top-1/2 z-30 flex max-h-[70dvh] -translate-y-1/2 select-none flex-col items-center rounded-full bg-bg/70 px-0.5 py-2 backdrop-blur-sm touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
    >
      {alphabet.map((letter) => {
        const enabled = presentLetters.has(letter)
        const active = letter === activeLetter
        const hovered = letter === hoverLetter
        return (
          <button
            key={letter}
            type="button"
            aria-label={t('ejercicios.irALetra', { letra: letter })}
            aria-current={active ? 'true' : undefined}
            disabled={!enabled}
            onClick={() => commitJump(letter)}
            className={`flex h-4 w-8 items-center justify-center rounded-full text-[8px] leading-none transition-colors ${
              active
                ? 'font-bold text-gold-bright'
                : hovered && enabled
                  ? 'text-gold'
                  : enabled
                    ? 'text-muted/80'
                    : 'text-muted/25'
            }`}
          >
            {letter}
          </button>
        )
      })}
    </div>
  )
}