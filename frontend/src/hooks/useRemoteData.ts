/**
 * TanStack Query wrapper for the panel that fetches on its own.
 *
 * CourseRecommendations hand-rolled its own loading, error, retry and
 * mount-guard state. Caching matters more than usual here: the free LLM tier
 * allows roughly twenty requests a minute, and switching tabs used to refetch.
 */
import { useQuery } from '@tanstack/react-query'

import { getCourseRecommendations } from '../services/api'
import type { Course, SkillGapAnalysis } from '../types/api'

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
