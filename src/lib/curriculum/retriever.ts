// Deterministic curriculum retrieval — no vector DB needed for 31 entries

import type { CurriculumDay, CurriculumModule } from '@/lib/types/curriculum';
import { loadCurriculum } from './loader';

export function getDayByNumber(dayNumber: number): CurriculumDay | null {
  const curriculum = loadCurriculum();
  return curriculum.days.find(d => d.day === dayNumber) ?? null;
}

export function getModuleForDay(dayNumber: number): CurriculumModule | null {
  const curriculum = loadCurriculum();
  return curriculum.modules.find(
    m => dayNumber >= m.days[0] && dayNumber <= m.days[1]
  ) ?? null;
}

export function getDaysForModule(moduleNumber: number): CurriculumDay[] {
  const curriculum = loadCurriculum();
  const mod = curriculum.modules.find(m => m.n === moduleNumber);
  if (!mod) return [];
  return curriculum.days.filter(
    d => d.day >= mod.days[0] && d.day <= mod.days[1]
  );
}

export function getAllDays(): CurriculumDay[] {
  return loadCurriculum().days;
}

export function getAllModules(): CurriculumModule[] {
  return loadCurriculum().modules;
}

export function getDaysByNumbers(dayNumbers: number[]): CurriculumDay[] {
  const curriculum = loadCurriculum();
  return dayNumbers
    .map(n => curriculum.days.find(d => d.day === n))
    .filter((d): d is CurriculumDay => d !== undefined);
}
