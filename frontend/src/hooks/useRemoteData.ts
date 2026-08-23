/**
 * TanStack Query wrappers for the two panels that fetch on their own.
 *
 * JobRecommendations and CourseRecommendations each hand-rolled loading, error,
 * retry and mount-guard state — the same forty lines twice, with subtly
 * different bugs. Caching also matters more than usual here: the free LLM tier
 * allows roughly twenty requests a minute, and switching tabs used to refetch.
 */
import { useQuery } from '@tanstack/react-query'

import { getCourseRecommendations, getJobRecommendations } from '../services/api'
import type { Course, Job, SkillGapAnalysis } from '../types/api'

const FIVE_MINUTES = 5 * 60 * 1000

export function useJobs(skills: string[], location: string, enabled = true) {
  return useQuery<Job[]>({
    queryKey: ['jobs', location, [...skills].sort().join(',')],
    queryFn: async ({ signal }) => {
      const data = await getJobRecommendations(skills, location, { signal })
      return data.jobs ?? []
    },
    enabled: enabled && skills.length > 0,
    staleTime: FIVE_MINUTES,
    retry: 1,
  })
}

export function useCourses(
  skillGaps: SkillGapAnalysis | null | undefined,
  jobDescription: string,
  resumeText: string,
) {
  const gapCount =
    (skillGaps?.critical?.length ?? 0) +
    (skillGaps?.important?.length ?? 0) +
    (skillGaps?.optional?.length ?? 0)

  return useQuery<Course[]>({
    queryKey: ['courses', JSON.stringify(skillGaps)],
    queryFn: async ({ signal }) => {
      const data = await getCourseRecommendations(skillGaps, jobDescription, resumeText, { signal })
      return data.courses ?? []
    },
    enabled: gapCount > 0,
    // Each call costs an LLM request, so never refetch one we already have.
    staleTime: Infinity,
    retry: 1,
  })
}
