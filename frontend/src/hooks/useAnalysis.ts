import { useCallback, useEffect, useRef, useState } from 'react'

import { analyzeResumeStream } from '../services/api'
import type { AnalysisResponse, HistoryEntry } from '../types/api'

const HISTORY_KEY = 'careeriq_history'
const HISTORY_LIMIT = 5

function saveToHistory(
  result: AnalysisResponse,
  jobDescription: string | File | null,
  jobDescriptionFile: File | null,
): void {
  try {
    const jdText = typeof jobDescription === 'string' ? jobDescription.trim() : ''
    const firstLine = jdText
      ? jdText.split('\n')[0]?.slice(0, 35)
      : jobDescriptionFile?.name || 'Resume Analysis'

    const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') as HistoryEntry[]
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      jobTitle: firstLine || 'Resume Analysis',
      score: result.fit?.overall ?? result.semantic_match_score,
      response: result,
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...existing].slice(0, HISTORY_LIMIT)))
  } catch (err) {
    // Quota is the usual cause: each entry stores the full response including
    // the resume text, so a few large resumes fill the 5MB budget.
    console.warn('Could not save analysis history', err)
  }
}

interface AnalysisState {
  data: AnalysisResponse | null
  loading: boolean
  error: string | null
  progress: number
  run: (
    file: File,
    jobDescription: string | File | null,
    jobDescriptionFile?: File | null,
  ) => Promise<void>
  reset: () => void
  loadAnalysis: (past: AnalysisResponse) => void
}

export function useAnalysis(): AnalysisState {
  const [data, setData] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const streamRef = useRef<{ abort: () => void } | null>(null)

  // Abort any in-flight analysis when the component unmounts.
  useEffect(() => () => streamRef.current?.abort(), [])

  const run = useCallback(
    async (
      file: File,
      jobDescription: string | File | null,
      jobDescriptionFile: File | null = null,
    ) => {
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
        setError((err as Error).message || 'Analysis failed. Please try again.')
      } finally {
        setLoading(false)
        streamRef.current = null
      }
    },
    [],
  )

  const reset = useCallback(() => {
    streamRef.current?.abort()
    setData(null)
    setError(null)
    setProgress(0)
  }, [])

  const loadAnalysis = useCallback((past: AnalysisResponse) => {
    setData(past)
    setError(null)
    setLoading(false)
  }, [])

  return { data, loading, error, progress, run, reset, loadAnalysis }
}
