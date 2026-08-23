import { useCallback, useEffect, useRef, useState } from 'react'
import { analyzeResumeStream } from '../services/api'

const HISTORY_KEY = 'careeriq_history'
const HISTORY_LIMIT = 5

function saveToHistory(result, jobDescription, jobDescriptionFile) {
  try {
    const jdText = typeof jobDescription === 'string' ? jobDescription.trim() : ''
    const firstLine = jdText
      ? jdText.split('\n')[0].slice(0, 35)
      : jobDescriptionFile?.name || 'Resume Analysis'

    const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    const item = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      jobTitle: firstLine || 'Resume Analysis',
      score: result.semantic_match_score,
      response: result,
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify([item, ...existing].slice(0, HISTORY_LIMIT)))
  } catch (err) {
    // Quota is the usual cause: each entry stores the full response including
    // the resume text, so a few large resumes fill the 5MB budget.
    console.warn('Could not save analysis history', err)
  }
}

export function useAnalysis() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)

  const streamRef = useRef(null)

  // Abort any in-flight analysis when the component unmounts.
  useEffect(() => () => streamRef.current?.abort(), [])

  const run = useCallback(async (file, jobDescription, jobDescriptionFile = null) => {
    streamRef.current?.abort()

    setLoading(true)
    setError(null)
    setData(null)
    setProgress(0)

    const stream = analyzeResumeStream(file, jobDescription, jobDescriptionFile, {
      onProgress: (pct) => setProgress(pct),
      onComplete: (result) => {
        setProgress(100)
        setData(result)
        saveToHistory(result, jobDescription, jobDescriptionFile)
      },
      onError: (message) => setError(message),
    })
    streamRef.current = stream

    try {
      await stream.done
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
      streamRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    streamRef.current?.abort()
    setData(null)
    setError(null)
    setProgress(0)
  }, [])

  const loadAnalysis = useCallback((pastResult) => {
    setData(pastResult)
    setError(null)
    setLoading(false)
  }, [])

  return { data, loading, error, progress, run, reset, loadAnalysis }
}
