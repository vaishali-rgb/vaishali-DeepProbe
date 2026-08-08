// Repetition checker — prevent asking the same question twice

export function isRepetition(
  newQuestion: string,
  previousQuestions: string[],
  threshold: number = 0.6
): boolean {
  const newWords = extractWords(newQuestion);

  for (const prev of previousQuestions) {
    const prevWords = extractWords(prev);
    const similarity = wordOverlap(newWords, prevWords);
    if (similarity >= threshold) return true;
  }

  return false;
}

function extractWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2) // skip small words
  );
}

function wordOverlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let overlap = 0;
  for (const word of a) {
    if (b.has(word)) overlap++;
  }
  const maxSize = Math.max(a.size, b.size);
  return overlap / maxSize;
}

export function formatAskedQuestions(questions: string[]): string {
  if (questions.length === 0) return '';
  return questions
    .map((q, i) => `${i + 1}. "${q}"`)
    .join('\n');
}
