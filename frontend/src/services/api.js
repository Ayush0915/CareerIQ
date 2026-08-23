import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

function buildAnalysisForm(file, jobDescription, jobDescriptionFile) {
  const formData = new FormData()
  formData.append('file', file)

  if (jobDescriptionFile instanceof File) {
    formData.append('job_description_file', jobDescriptionFile)
  } else if (jobDescription instanceof File) {
    formData.append('job_description_file', jobDescription)
  } else if (jobDescription) {
    formData.append('job_description', jobDescription)
  }

  return formData
}

/**
 * Streams the analysis, emitting progress events until the result arrives.
 *
 * Returns an `abort` function. Without one, navigating away mid-analysis left
 * the stream running against state nobody was listening to.
 */
export function analyzeResumeStream(
  file,
  jobDescription,
  jobDescriptionFile = null,
  { onProgress, onComplete, onError } = {},
) {
  const controller = new AbortController()

  const done = (async () => {
    let response
    try {
      response = await fetch(`${BASE_URL}/analyze`, {
        method: 'POST',
        body: buildAnalysisForm(file, jobDescription, jobDescriptionFile),
        signal: controller.signal,
      })
    } catch (err) {
      if (err.name === 'AbortError') return
      throw new Error('Could not reach the server. Is the backend running?')
    }

    if (!response.ok) {
      let detail = 'Analysis failed. Please try again.'
      try {
        const body = await response.json()
        detail = body.detail || detail
      } catch {
        /* non-JSON error body — keep the default message */
      }
      throw new Error(detail)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      for (;;) {
        const { done: finished, value } = await reader.read()
        if (finished) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop()

        for (const part of parts) {
          const trimmed = part.trim()
          if (!trimmed.startsWith('data: ')) continue

          let payload
          try {
            payload = JSON.parse(trimmed.slice(6))
          } catch (err) {
            console.error('Malformed SSE payload', err)
            continue
          }

          if (payload.event === 'progress') onProgress?.(payload.progress, payload.message)
          else if (payload.event === 'complete') onComplete?.(payload.result)
          else if (payload.event === 'error') onError?.(payload.message)
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') throw err
    } finally {
      reader.cancel().catch(() => {})
    }
  })()

  return { done, abort: () => controller.abort() }
}

/**
 * Generates one coaching artefact.
 *
 * One call per mode, on demand. The previous bundle endpoint fired all five
 * generators on every visit to the tab — five of roughly twenty free requests
 * per minute, for output the user might never scroll to.
 */
export async function generateCoaching(mode, payload, { signal } = {}) {
  const response = await axios.post(
    `${BASE_URL}/ai-coach/generate`,
    { mode, ...payload },
    { timeout: 60000, signal },
  )
  return response.data
}

export async function getCoachingModes() {
  const response = await axios.get(`${BASE_URL}/ai-coach/modes`, { timeout: 10000 })
  return response.data.modes
}

export async function getJobRecommendations(skills, location = 'India', { signal } = {}) {
  const response = await axios.post(
    `${BASE_URL}/jobs`,
    { skills, location },
    { timeout: 65000, signal },
  )
  return response.data
}

export async function getCourseRecommendations(
  skillGapAnalysis,
  jobDescription = '',
  resumeText = '',
  { signal } = {},
) {
  const response = await axios.post(
    `${BASE_URL}/ai-coach/course-recommendations`,
    {
      skill_gap_analysis: skillGapAnalysis,
      job_description: jobDescription,
      resume_text: resumeText,
    },
    { timeout: 45000, signal },
  )
  return response.data
}
