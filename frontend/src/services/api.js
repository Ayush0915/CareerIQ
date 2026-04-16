import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

export async function analyzeResume(file, jobDescription) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('job_description', jobDescription)
  const response = await axios.post(`${BASE_URL}/analyze`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  })
  return response.data
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