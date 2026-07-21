import { useState } from 'react'
import { analyzeResumeStream } from '../services/api'

export function useAnalysis() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)

  async function run(file, jobDescription, jobDescriptionFile = null) {
    setLoading(true)
    setError(null)
    setData(null)
    setProgress(0)

    try {
      await analyzeResumeStream(
        file,
        jobDescription,
        jobDescriptionFile,
        (pct) => {
          setProgress(pct)
        },
        (result) => {
          setProgress(100)
          setData(result)

          // Save analysis to localStorage history (capped at 5)
          try {
            const jdText = typeof jobDescription === 'string' ? jobDescription.trim() : ''
            const firstLine = jdText ? jdText.split('\n')[0].slice(0, 35) : (jobDescriptionFile?.name || 'Resume Analysis')
            const jobTitle = firstLine || 'Resume Analysis'
            const existing = JSON.parse(localStorage.getItem('careeriq_history') || '[]')
            const item = {
              id: crypto.randomUUID(),
              createdAt: Date.now(),
              jobTitle: jobTitle,
              score: result.semantic_match_score,
              response: result
            }
            const updated = [item, ...existing].slice(0, 5)
            localStorage.setItem('careeriq_history', JSON.stringify(updated))
          } catch (err) {
            console.warn('Could not save history to localStorage', err)
          }
        },
        (errMessage) => {
          setError(errMessage)
        }
      )
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setData(null)
    setError(null)
    setProgress(0)
  }

  function loadAnalysis(pastResult) {
    setData(pastResult)
    setError(null)
    setLoading(false)
  }

  return { data, loading, error, progress, run, reset, loadAnalysis }
}
