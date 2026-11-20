// Code checks on every card, after the model answers. Problems go back to the model
// once to fix; anything still wrong after that is fixed or removed here.
import type { Card, EatOutCard, Mode, Profile, RecipeCard, SwapCard } from './schemas.js';

export const STAR_FRUIT_WARNING =
  'Skip star fruit (carambola). It can be dangerous for people with kidney disease, even in small amounts. Talk to your care team if you have had some.';

const STAR_FRUIT = /\b(star ?fruits?|carambolas?)\b/i;
const SALT_SUB = /\b(salt substitutes?|salt replacers?|lite salt|light salt|lo-?salt|nu-?salt|nosalt|potassium chloride|potassium-based salt)\b/gi;
const NEGATION = /\b(no|not|never|avoid|skip|don'?t|without|instead of|steer clear|careful)\b/i;
const PROTEIN_CUT = [
  /\b(cut|cutting|reduce|reducing|less|lower|limit|limiting|smaller|skip|fewer|half|halve|trim|drop)\b[^.;]{0,30}\bprotein\b/i,
  /\bprotein\b[^.;]{0,20}\b(less|smaller|cut|reduce|limit|lower|fewer)\b/i,
];
const DAILY_TARGET = /\b\d[\d,.]*\s?(mg|milligrams?|g|grams?)\b[^.;]{0,25}\b(a day|per day|each day|daily)\b/i;
const SOUPY = /\b(soup|broth|pho|congee|jook|juk|porridge|hot ?pot|ramen|sinigang|stew|jjigae|caldo|pozole|menudo|tong|smoothie)\b/i;
const FLUID = /\b(fluid|liquid)/i;

/** True when the text recommends a salt substitute (a warning against one is fine). */
export function suggestsSaltSubstitute(text: string): boolean {
  for (const m of text.matchAll(SALT_SUB)) {
    // Look from the start of the sentence: "Avoid salt substitutes, which contain potassium chloride" is a warning.
    const start = Math.max(0, ...['.', ';', '!', '?'].map((c) => text.lastIndexOf(c, (m.index ?? 0) - 1) + 1));
    if (!NEGATION.test(text.slice(start, m.index))) return true;
  }
  return false;
}

export function suggestsCuttingProtein(text: string): boolean {
  return PROTEIN_CUT.some((re) => re.test(text));
}

/** The parts of a card that are suggestions (what the person is told to do). */
export function suggestionTexts(mode: Mode, card: Card): string[] {
  if (mode === 'swap') {
    const c = card as SwapCard;
    return [c.answer ?? '', c.headline, c.tonight, c.portion ?? '', ...c.swaps.flatMap((s) => [s.title, s.how])];
  }
  if (mode === 'eatout') {
    const c = card as EatOutCard;
    return [c.tip, c.portion ?? '', ...c.picks.flatMap((p) => [p.item, p.say])];
  }
  const c = card as RecipeCard;
  return [c.intro, c.portion ?? '', ...c.changes.map((x) => x.to), ...c.ingredients, ...c.steps, ...c.keep_flavor];
}

function allText(card: Card): string {
  return JSON.stringify(card);
}

export interface CheckContext {
  mode: Mode;
  profile: Profile;
  input: string; // everything the person typed, plus the dish name read from a photo
  allowedSources: Set<string>;
}

// Shaming words. FuelWell says "Instead of -> Try", never that a food is bad.
const SHAMING = /\b(unhealthy|junk[- ]?food|bad for you|bad food|guilt(y|-free)?|cheat (meal|day)|forbidden)\b/i;
export const hasShamingWords = (text: string) => SHAMING.test(text);

// A portion tip must not hand a person numbers to eat ("1 cup rice", "3 oz chicken").
const PORTION_NUMBER = /\b\d[\d./]*\s?(g|grams?|oz|ounces?|cups?|mg|milligrams?|tbsp|tablespoons?|tsp|teaspoons?)\b/i;

/** Problems worth one repair round, in words the model can act on. */
export function findProblems(card: Card, ctx: CheckContext): string[] {
  const problems: string[] = [];
  const suggestions = suggestionTexts(ctx.mode, card);
  if (hasShamingWords(allText(card))) {
    problems.push('Never call a food "unhealthy", "junk", "bad" or "guilty". Describe what to watch and what to try instead, kindly.');
  }
  if (suggestions.some(suggestsSaltSubstitute)) {
    problems.push('Remove every suggestion of salt substitutes or "lite salt" (many contain potassium chloride).');
  }
  if (ctx.profile.stage === 'dialysis' && suggestions.some(suggestsCuttingProtein)) {
    problems.push('This person is on dialysis: never suggest cutting or shrinking protein. Keep protein portions as they are.');
  }
  if (ctx.profile.stage === 'dialysis' && SOUPY.test(ctx.input) && !FLUID.test(allText(card))) {
    problems.push('This person is on dialysis and the meal has soup, broth or liquid: mention that soups and broths count toward fluid limits.');
  }
  if (DAILY_TARGET.test(allText(card))) {
    problems.push('Remove personal numeric daily targets (mg or grams per day). Say "your dietitian sets your numbers" instead.');
  }
  if (STAR_FRUIT.test(ctx.input) && !STAR_FRUIT.test(card.heads_up ?? '')) {
    problems.push('The meal includes star fruit: put a clear star fruit warning in heads_up.');
  }
  if (!STAR_FRUIT.test(ctx.input) && suggestions.some((t) => STAR_FRUIT.test(t))) {
    problems.push('Never suggest star fruit.');
  }
  const used = card.sources.filter((s) => ctx.allowedSources.has(s));
  if (ctx.allowedSources.size && !used.length) {
    problems.push(`List the IDs you used in sources, copied exactly from the context. Allowed IDs: ${[...ctx.allowedSources].join(', ')}.`);
  }
  if (card.sources.some((s) => !ctx.allowedSources.has(s))) {
    problems.push('sources may only contain IDs shown in square brackets in the context.');
  }
  const portionText = (card as { portion?: string }).portion ?? '';
  if (!portionText.trim()) problems.push('Add one portion tip for this dish in plain household words.');
  else if (PORTION_NUMBER.test(portionText)) problems.push('The portion tip must not give the person grams, cups, ounces or mg. Use relative words (less rice, more vegetables, sauce on the side).');
  if (ctx.mode === 'eatout' && (card as EatOutCard).picks.length !== 3) problems.push('Give exactly 3 picks.');
  if (ctx.mode === 'swap' && (card as SwapCard).swaps.length < 2) problems.push('Give 2 or 3 swaps or add-ons.');
  if (ctx.mode === 'recipe' && (card as RecipeCard).changes.length < 3) problems.push('Give 3 to 5 changes.');
  return problems;
}

/** Last line of defence: trims to the card limits and removes anything still unsafe. */
const PORTION_FALLBACK = 'Keep your usual plate, and ask your kidney dietitian which portions fit you.';
const portionLine = (t: string | undefined, unsafe: (s: string) => boolean) => {
  const text = (t ?? '').trim();
  return text && !unsafe(text) && !PORTION_NUMBER.test(text) ? text : PORTION_FALLBACK;
};

export function enforce(card: Card, ctx: CheckContext): Card {
  const dialysis = ctx.profile.stage === 'dialysis';
  const unsafe = (t: string) => suggestsSaltSubstitute(t) || (dialysis && suggestsCuttingProtein(t)) || DAILY_TARGET.test(t);
  const safeLine = (t: string, fallback: string) => (unsafe(t) ? fallback : t);
  const sources = [...new Set(card.sources.filter((s) => ctx.allowedSources.has(s)))];
  let headsUp = card.heads_up && card.heads_up.trim() ? card.heads_up.trim() : null;
  if (STAR_FRUIT.test(ctx.input) && !STAR_FRUIT.test(headsUp ?? '')) {
    headsUp = headsUp ? `${STAR_FRUIT_WARNING} ${headsUp}` : STAR_FRUIT_WARNING;
  }

  if (ctx.mode === 'swap') {
    const c = card as SwapCard;
    return {
      ...c,
      answer: c.answer && c.answer.trim() ? safeLine(c.answer.trim(), 'Your dietitian is the best person to answer that for you. Here are some general tips for this meal.') : null,
      headline: safeLine(c.headline, 'A few small changes can make this kidney-friendlier.'),
      watch: c.watch.slice(0, 3),
      swaps: c.swaps.filter((s) => !unsafe(`${s.title} ${s.how}`)).slice(0, 3),
      tonight: safeLine(c.tonight, 'Taste before adding any salt or sauce, and ask your dietitian about this meal.'),
      portion: portionLine(c.portion, unsafe),
      heads_up: headsUp,
      sources,
    };
  }
  if (ctx.mode === 'eatout') {
    const c = card as EatOutCard;
    return {
      ...c,
      picks: c.picks.filter((p) => !unsafe(`${p.item} ${p.say}`)).slice(0, 3),
      tip: safeLine(c.tip, 'Ask for sauces and dressings on the side.'),
      portion: portionLine(c.portion, unsafe),
      heads_up: headsUp,
      sources,
    };
  }
  const c = card as RecipeCard;
  return {
    ...c,
    intro: safeLine(c.intro, 'A kidney-friendlier version that keeps the family flavor.'),
    changes: c.changes.filter((x) => !unsafe(x.to)).slice(0, 5),
    ingredients: c.ingredients.filter((x) => !unsafe(x)).slice(0, 25),
    steps: c.steps.filter((x) => !unsafe(x)).slice(0, 8),
    keep_flavor: c.keep_flavor.filter((x) => !unsafe(x)).slice(0, 3),
    portion: portionLine(c.portion, unsafe),
    heads_up: headsUp,
    sources,
  };
}
