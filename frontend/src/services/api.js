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