/**
 * content.config.ts — Astro 6 content collection schemas.
 *
 * Two collections:
 *   - regions: YAML data files (src/content/regions/*.yaml)
 *   - recipes: MDX content files (src/content/recipes/*.mdx)
 *
 * Astro 6 requires loaders. We use the built-in glob() loader for both.
 * The regions schema is a frontend-facing subset of the backend region JSONs.
 * The recipes schema is pre-defined here so M2 can author without touching config.
 */

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const regionsCollection = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/regions' }),
  schema: z.object({
    id: z.enum([
      'neapolitan',
      'lyonnais',
      'cajun-creole',
      'nyc-street-food',
      'washoku',
    ]),
    displayName: z.string(),
    cuisineFamily: z.string(),
    expertVoice: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lon: z.number(),
      city: z.string(),
    }),
    voiceDescription: z.string(),
    voiceQuote: z.string(),
    shortBlurb: z.string(),
    legendaryTechniques: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
        skillLevel: z
          .enum(['beginner', 'intermediate', 'advanced', 'legendary'])
          .optional(),
      })
    ),
    integrityLines: z.array(
      z.object({
        rule: z.string(),
        severity: z
          .enum(['absolute', 'strong', 'mild'])
          .default('strong'),
      })
    ),
    legendaryChefs: z.array(
      z.object({
        name: z.string(),
        era: z.string(),
        significance: z.string(),
      })
    ),
    seasonalCalendar: z.record(z.string(), z.array(z.string())).optional(),
    culturalNote: z.string().optional(),
    sacredIngredients: z.array(z.string()).optional(),
  }),
});

const recipesCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/recipes' }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    region: z.enum([
      'neapolitan',
      'lyonnais',
      'cajun-creole',
      'nyc-street-food',
      'washoku',
    ]),
    heroImage: z.string(),
    heroPhotographer: z.string(),
    heroPhotographerUrl: z.string().url(),
    servings: z.number(),
    time: z.object({
      prep: z.string(),
      cook: z.string(),
      total: z.string(),
    }),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    techniques: z.array(z.string()),
    integrityLines: z.array(
      z.object({
        rule: z.string(),
        severity: z.enum(['absolute', 'strong', 'mild']).default('strong'),
      })
    ).default([]),
    ingredients: z.array(z.object({
      quantity: z.string(),
      name: z.string(),
      note: z.string().optional(),
    })).default([]),
    method: z.array(z.object({
      step: z.string(),
      tip: z.string().optional(),
    })).default([]),
    seoDescription: z.string(),
    publishedAt: z.date(),
    plateNumber: z.number().int(),
  }),
});

export const collections = {
  regions: regionsCollection,
  recipes: recipesCollection,
};
