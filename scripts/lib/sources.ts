import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const ROOT = process.cwd();
export const DATA_DIR = path.join(ROOT, 'data');
export const GUIDELINE_DIR = path.join(DATA_DIR, 'guidelines');

export interface GuidelineSource {
  id: string;
  title: string;
  url: string;
  file: string;
  kind: 'pdf' | 'pdf-download' | 'web';
  /** Optional inclusive PDF page range(s), e.g. [60, 75] or [[39, 51], [74, 86]] */
  pages?: [number, number] | [number, number][];
}

/** Always a list of [first, last] ranges, or null for the whole file. */
export function pageRanges(s: GuidelineSource): [number, number][] | null {
  if (!s.pages?.length) return null;
  return Array.isArray(s.pages[0]) ? (s.pages as [number, number][]) : [s.pages as [number, number]];
}

export async function loadSources(): Promise<GuidelineSource[]> {
  const raw = JSON.parse(await readFile(path.join(GUIDELINE_DIR, 'sources.json'), 'utf8'));
  return raw.sources as GuidelineSource[];
}
