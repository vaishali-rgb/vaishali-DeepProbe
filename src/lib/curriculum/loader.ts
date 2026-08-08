// Load and cache curriculum.json in memory

import type { Curriculum } from '@/lib/types/curriculum';
import curriculumData from '@/data/curriculum.json';

let cachedCurriculum: Curriculum | null = null;

export function loadCurriculum(): Curriculum {
  if (!cachedCurriculum) {
    cachedCurriculum = curriculumData as Curriculum;
  }
  return cachedCurriculum;
}
