import { useState, useEffect } from 'react'

/**
 * Custom hook for typewriter text effect
 * @param {string[]} phrases Array of phrases to cycle through
 * @param {Object} options Options for speed, pause, etc.
 * @returns {{ displayedText: string, isDeleting: boolean, isPaused: boolean }}
 */
export function useTypewriter(phrases = [], options = {}) {
  const {
    typingSpeed = 55,
    deletingSpeed = 25,
    pauseDuration = 1500,
  } = options

  const [phraseIndex, setPhraseIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (!phrases || phrases.length === 0) return

    // Respect prefers-reduced-motion OS setting
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayedText(phrases[0])
      setIsPaused(true)
      return
    }

    const currentPhrase = phrases[phraseIndex] || ''
    let timer

    if (isDeleting) {
      setIsPaused(false)
      if (displayedText.length > 0) {
        timer = setTimeout(() => {
          setDisplayedText(currentPhrase.substring(0, displayedText.length - 1))
        }, deletingSpeed)
      } else {
        setIsDeleting(false)
        setPhraseIndex((prev) => (prev + 1) % phrases.length)
      }
    } else {
      if (displayedText.length < currentPhrase.length) {
        setIsPaused(false)
        timer = setTimeout(() => {
          setDisplayedText(currentPhrase.substring(0, displayedText.length + 1))
        }, typingSpeed)
      } else {
        // Fully typed phrase - pause before deleting
        setIsPaused(true)
        timer = setTimeout(() => {
          setIsDeleting(true)
        }, pauseDuration)
      }
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [displayedText, isDeleting, phraseIndex, phrases, typingSpeed, deletingSpeed, pauseDuration])

  return { displayedText, isDeleting, isPaused }
}
