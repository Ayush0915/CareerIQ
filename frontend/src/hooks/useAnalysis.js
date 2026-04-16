import { useState } from 'react'
import { analyzeResume } from '../services/api'

export function useAnalysis() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)

  async function run(file, jobDescription) {
    setLoading(true)
    setError(null)
    setData(null)
    setProgress(0)

    const steps = [
      { label: 'Parsing resume...', pct: 20 },
      { label: 'Extracting skills...', pct: 40 },
      { label: 'Running semantic analysis...', pct: 65 },
      { label: 'Classifying skill gaps...', pct: 85 },
      { label: 'Generating insights...', pct: 95 },
    ]

    let i = 0
    const interval = setInterval(() => {
      if (i < steps.length) {
        setProgress(steps[i].pct)
        i++
      } else {
        clearInterval(interval)
      }
    }, 1200)

    try {
      const result = await analyzeResume(file, jobDescription)
      clearInterval(interval)
      setProgress(100)
      setTimeout(() => setData(result), 300)
    } catch (err) {
      clearInterval(interval)
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setData(null)
    setError(null)
    setProgress(0)
  }

  return { data, loading, error, progress, run, reset }
}
