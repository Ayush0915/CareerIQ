import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

export async function analyzeResume(file, jobDescription, jobDescriptionFile = null) {
  const formData = new FormData()
  formData.append('file', file)
  if (jobDescriptionFile instanceof File) {
    formData.append('job_description_file', jobDescriptionFile)
  } else if (jobDescription instanceof File) {
    formData.append('job_description_file', jobDescription)
  } else if (jobDescription) {
    formData.append('job_description', jobDescription)
  }
  const response = await axios.post(`${BASE_URL}/analyze`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  })
  return response.data
}

export async function analyzeResumeStream(file, jobDescription, jobDescriptionFile = null, onProgress, onComplete, onError) {
  const formData = new FormData()
  formData.append('file', file)
  if (jobDescriptionFile instanceof File) {
    formData.append('job_description_file', jobDescriptionFile)
  } else if (jobDescription instanceof File) {
    formData.append('job_description_file', jobDescription)
  } else if (jobDescription) {
    formData.append('job_description', jobDescription)
  }

  const response = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    let detail = 'Analysis failed. Please try again.'
    try {
      const errJson = await response.json()
      detail = errJson.detail || detail
    } catch (_) {}
    throw new Error(detail)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop()

    for (const part of parts) {
      const trimmed = part.trim()
      if (trimmed.startsWith('data: ')) {
        const jsonStr = trimmed.slice(6)
        try {
          const payload = JSON.parse(jsonStr)
          if (payload.event === 'progress') {
            if (onProgress) onProgress(payload.progress, payload.message)
          } else if (payload.event === 'complete') {
            if (onComplete) onComplete(payload.result)
          } else if (payload.event === 'error') {
            if (onError) onError(payload.message)
            else throw new Error(payload.message)
          }
        } catch (err) {
          console.error('Error parsing SSE payload:', err)
        }
      }
    }
  }
}

export async function getAICoaching(data) {
  const response = await axios.post(`${BASE_URL}/ai-coach`, data, {
    timeout: 30000,
  })
  return response.data
}

export async function getJobRecommendations(skills, location = 'India') {
  const response = await axios.post(`${BASE_URL}/jobs`, { skills, location }, {
    timeout: 65000,
  })
  return response.data
}

export async function getCourseRecommendations(skillGapAnalysis, jobDescription = '', resumeText = '') {
  const response = await axios.post(`${BASE_URL}/ai-coach/course-recommendations`, {
    skill_gap_analysis: skillGapAnalysis,
    job_description: jobDescription,
    resume_text: resumeText,
  }, {
    timeout: 45000,
  })
  return response.data
}