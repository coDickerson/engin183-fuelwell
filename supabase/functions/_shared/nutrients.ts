// Typed view over ./renal-data.mjs, the single source of truth for nutrient values,
// per-meal thresholds, swaps and the fallback dish library. The same .mjs file is
// imported by the renal-recipe-check Claude Code skill, so they cannot drift.
// See renal-data.mjs for sources (USDA FoodData Central SR Legacy / FNDDS) and the
// threshold reasoning (NKF / KDOQI-based meal-level demo heuristics).
import * as data from './renal-data.mjs';

export type Level = 'low' | 'mid' | 'high';
export type Cuisine = 'chinese' | 'korean' | 'vietnamese';

export interface NutrientRow {
  name: string;
  aliases: string[];
  k: number;
  p: number;
  na: number;
  fdc?: number;
  note?: string;
  group: string;
}

export interface Amount {
  name: string;
  amount_g: number;
}

export interface Totals {
  k_mg: number;
  p_mg: number;
  na_mg: number;
}

export interface Levels {
  k: Level;
  p: Level;
  na: Level;
}

export interface TotalsLine extends Totals {
  name: string;
  amount_g: number;
  matched: string | null;
}

export interface TotalsResult {
  lines: TotalsLine[];
  totals: Totals;
  levels: Levels;
  unknown: string[];
}

export interface Swap {
  from: string;
  to: string;
  why: string;
}

export interface Dish {
  key: string;
  cuisine: Cuisine;
  name: string;
  aliases: string[];
  ingredients: Amount[];
}

export const NUTRIENTS = data.NUTRIENTS as unknown as NutrientRow[];
export const THRESHOLDS = data.THRESHOLDS as unknown as Record<'k' | 'p' | 'na', { lowBelow: number; midMax: number }>;
export const DISCLAIMER = data.DISCLAIMER as string;
export const DISHES = data.DISHES as unknown as Dish[];

export const levelFor = data.levelFor as unknown as (nutrient: 'k' | 'p' | 'na', mg: number) => Level;
export const findNutrient = data.findNutrient as unknown as (query: string) => NutrientRow | null;
export const computeTotals = data.computeTotals as unknown as (ingredients: Amount[]) => TotalsResult;
export const findDish = data.findDish as unknown as (text: string) => Dish | null;
export const applySwaps = data.applySwaps as unknown as (
  ingredients: Amount[],
) => { after: (Amount & { swapped_from?: string })[]; swaps: Swap[] };
