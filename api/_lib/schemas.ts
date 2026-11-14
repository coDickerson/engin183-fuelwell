// Shapes of what comes in (validated, size-capped) and what the AI must return (the cards).
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------
export const ProfileSchema = z
  .object({
    for_whom: z.enum(['me', 'family']).optional(),
    stage: z.enum(['early', 'stage3', 'stage4', 'stage5', 'dialysis', 'not_sure']).optional(),
    also: z.array(z.enum(['diabetes', 'high_blood_pressure'])).max(2).optional(),
    cuisines: z.array(z.string().trim().min(1).max(40)).max(8).optional(),
    usually: z.enum(['home', 'frozen', 'takeout']).optional(),
    notes: z.string().trim().max(300).optional(),
  })
  .partial();
export type Profile = z.infer<typeof ProfileSchema>;

/** A missing or malformed profile is not an error: the app gives general advice. */
export function parseProfile(value: unknown): Profile {
  const parsed = ProfileSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : {};
}

const text = (max: number) => z.string().trim().min(1).max(max);

export const SwapInputSchema = z
  .object({
    meal: z.string().trim().max(300).optional(),
    imageBase64: z.string().max(6_000_000).optional(), // data URL; checked again in images.ts
    profile: z.unknown().optional(),
  })
  .refine((v) => Boolean(v.meal) || Boolean(v.imageBase64), { message: 'Type a meal or add a photo.' });

export const EatOutInputSchema = z.object({
  restaurant: text(120),
  usualOrder: z.string().trim().max(300).optional(),
  profile: z.unknown().optional(),
});

export const RecipeInputSchema = z.object({
  recipe: text(6000),
  profile: z.unknown().optional(),
});

// ---------------------------------------------------------------------------
// Cards (what the model must return). Limits live in the descriptions because
// the API's JSON-schema mode ignores min/max; code trims and checks afterwards.
// ---------------------------------------------------------------------------
export const NutrientSchema = z.enum(['Na', 'K', 'P', 'Fluid', 'Sugar']);

const sources = z
  .array(z.string())
  .describe('IDs of the catalog rows and guideline passages you actually used, copied exactly, e.g. "catalog:pho" or "nkf-potassium:3". Never invent IDs.');

const portion = z
  .string()
  .describe('One portion tip in plain words that keeps the dish, e.g. "Same bowl, fewer noodles: fill the space with bok choy and the chicken." No grams, cups or mg for the person.');

const headsUp = z
  .string()
  .nullable()
  .describe('One short caution when it really matters (star fruit, herbal remedies, a very salty item), otherwise null.');

export const SwapCardSchema = z.object({
  dish: z.string().describe('Short dish name, e.g. "Mom\'s congee with salted egg"'),
  answer: z
    .string()
    .nullable()
    .describe('If the person asked a question, a direct answer to that exact question in 2 to 4 short sentences. Otherwise null.'),
  verdict: z
    .enum(['good_pick', 'tweak', 'swap'])
    .describe('good_pick = already a good pick; tweak = keep it, tweak it; swap = try a swap'),
  headline: z.string().describe('One plain sentence, no more than 20 words'),
  watch: z
    .array(z.object({ nutrient: NutrientSchema, note: z.string().describe('One short line') }))
    .describe('At most 3 things to watch in this meal'),
  swaps: z
    .array(
      z.object({
        title: z.string().describe('Short name of the swap or add-on'),
        how: z.string().describe('How to do it, one or two short sentences'),
        why: z.string().describe('Why it helps, one short line'),
      }),
    )
    .describe('2 or 3 swaps or add-ons, additions and easy tweaks first'),
  tonight: z.string().describe('One easy step they can take tonight'),
  portion,
  heads_up: headsUp,
  sources,
});
export type SwapCard = z.infer<typeof SwapCardSchema>;

export const EatOutCardSchema = z.object({
  restaurant: z.string(),
  picks: z
    .array(
      z.object({
        item: z.string().describe('Menu item'),
        say: z.string().describe('Exact words to say when ordering, e.g. "Grilled chicken breast, skin off, salsa on the side, please."'),
        why: z.string().describe('One short line'),
      }),
    )
    .describe('Exactly 3 picks'),
  skip: z.object({ item: z.string(), why: z.string() }).describe('One item to skip'),
  tip: z.string().describe('One short tip for eating out'),
  portion,
  heads_up: headsUp,
  sources,
});
export type EatOutCard = z.infer<typeof EatOutCardSchema>;

export const RecipeCardSchema = z.object({
  title: z.string().describe('New title that keeps the dish recognisable'),
  intro: z.string().describe('One plain sentence'),
  changes: z
    .array(z.object({ from: z.string(), to: z.string(), why: z.string() }))
    .describe('3 to 5 changes, old to new'),
  ingredients: z.array(z.string()).describe('Ingredient lines with amounts for the adapted version'),
  steps: z.array(z.string()).describe('At most 8 short steps'),
  keep_flavor: z.array(z.string()).describe('2 or 3 tips that keep the family flavor'),
  portion,
  heads_up: headsUp,
  sources,
});
export type RecipeCard = z.infer<typeof RecipeCardSchema>;

export const DishGuessSchema = z.object({
  is_food: z.boolean().describe('false if the photo does not show food or a drink'),
  dish: z.string().describe('The dish in a few plain words, e.g. "chicken pho with herbs"; empty if not food'),
});

export type Mode = 'swap' | 'eatout' | 'recipe';
export type Card = SwapCard | EatOutCard | RecipeCard;

export const CARD_SCHEMAS = {
  swap: SwapCardSchema,
  eatout: EatOutCardSchema,
  recipe: RecipeCardSchema,
} as const;

export const DISCLAIMER = 'FuelWell student prototype. Not medical advice. Check with your dietitian or care team.';
