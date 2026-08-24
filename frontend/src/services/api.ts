import axios from 'axios'

import type {
  AnalysisResponse,
  AnalysisStreamEvent,
  CoachingMode,
  CoachingPayload,
  CoachingResponse,
  CoursesResponse,
  JobsResponse,
  SkillGapAnalysis,
} from '../types/api'

interface StreamHandlers {
  onProgress?: (progress: number, message: string) => void
  onComplete?: (result: AnalysisResponse) => void
  onError?: (message: string) => void
}

interface RequestOptions {
  signal?: AbortSignal
}

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

// /health sits at the server root, not under the versioned API prefix.
const HEALTH_URL = `${BASE_URL.replace(/\/api\/v\d+\/?$/, '')}/health`

let wakeInFlight: Promise<boolean> | null = null

/**
 * Nudges the backend awake and resolves when it answers.
 *
 * Render's free tier stops the instance after 15 minutes idle and takes about
 * a minute to come back, model load included. Every request timeout in this
 * file is 45-65s, so the first analysis after a quiet period was guaranteed to
 * abort before the server finished booting — and the user saw a timeout rather
 * than a cold start.
 *
 * Calling this on mount spends that minute while the user is still choosing a
 * file and pasting a job description, which is already the slowest part of the
 * flow for them.
 *
 * Deliberately never rejects: a failed wake-up is not a failed analysis, and
 * the real request will surface a genuine outage on its own. Concurrent callers
 * share one in-flight request.
 */
export function wakeBackend(timeoutMs = 90000): Promise<boolean> {
  if (wakeInFlight) return wakeInFlight

  wakeInFlight = axios
    .get(HEALTH_URL, { timeout: timeoutMs })
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      // Allow a later retry once this attempt settles — an instance can spin
      // down again during a long session.
      setTimeout(() => {
        wakeInFlight = null
      }, 60000)
    })

  return wakeInFlight
}

function buildAnalysisForm(
  file: File,
  jobDescription: string | File | null,
  jobDescriptionFile: File | null,
): FormData {
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
  file: File,
  jobDescription: string | File | null,
  jobDescriptionFile: File | null = null,
  { onProgress, onComplete, onError }: StreamHandlers = {},
): { done: Promise<void>; abort: () => void } {
  const controller = new AbortController()

  const done = (async () => {
    let response: Response
    try {
      response = await fetch(`${BASE_URL}/analyze`, {
        method: 'POST',
        body: buildAnalysisForm(file, jobDescription, jobDescriptionFile),
        signal: controller.signal,
      })
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
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

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      for (;;) {
        const { done: finished, value } = await reader.read()
        if (finished) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          const trimmed = part.trim()
          if (!trimmed.startsWith('data: ')) continue

          let payload: AnalysisStreamEvent
          try {
            payload = JSON.parse(trimmed.slice(6)) as AnalysisStreamEvent
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
      if ((err as Error).name !== 'AbortError') throw err
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
export async function generateCoaching(
  mode: CoachingMode,
  payload: CoachingPayload,
  { signal }: RequestOptions = {},
): Promise<CoachingResponse> {
  const response = await axios.post<CoachingResponse>(
    `${BASE_URL}/ai-coach/generate`,
    { mode, ...payload },
    { timeout: 60000, signal },
  )
  return response.data
}

export async function getCoachingModes(): Promise<Array<{ id: CoachingMode; label: string }>> {
  const response = await axios.get<{ modes: Array<{ id: CoachingMode; label: string }> }>(
    `${BASE_URL}/ai-coach/modes`,
    { timeout: 10000 },
  )
  return response.data.modes
}

export async function getJobRecommendations(
  skills: string[],
  location = 'India',
  { signal }: RequestOptions = {},
): Promise<JobsResponse> {
  const response = await axios.post<JobsResponse>(
    `${BASE_URL}/jobs`,
    { skills, location },
    { timeout: 65000, signal },
  )
  return response.data
}

export async function getCourseRecommendations(
  skillGapAnalysis: SkillGapAnalysis | null | undefined,
  jobDescription = '',
  resumeText = '',
  { signal }: RequestOptions = {},
): Promise<CoursesResponse> {
  const response = await axios.post<CoursesResponse>(
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
