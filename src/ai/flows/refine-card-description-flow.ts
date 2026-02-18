'use server';
/**
 * @fileOverview An AI assistant flow for refining card descriptions.
 *
 * - refineCardDescription - A function that analyzes and suggests improvements for card descriptions.
 * - RefineCardDescriptionInput - The input type for the refineCardDescription function.
 * - RefineCardDescriptionOutput - The return type for the refineCardDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RefineCardDescriptionInputSchema = z.object({
  description: z
    .string()
    .describe('The card description to be analyzed and refined.'),
});
export type RefineCardDescriptionInput = z.infer<
  typeof RefineCardDescriptionInputSchema
>;

const RefineCardDescriptionOutputSchema = z.object({
  refinedDescription: z
    .string()
    .describe('The improved version of the card description.'),
  suggestions: z
    .array(z.string())
    .describe('A list of specific suggestions for improving the description, if any.'),
  isRefined: z
    .boolean()
    .describe(
      'True if the description was significantly improved, false otherwise.'
    ),
});
export type RefineCardDescriptionOutput = z.infer<
  typeof RefineCardDescriptionOutputSchema
>;

export async function refineCardDescription(
  input: RefineCardDescriptionInput
): Promise<RefineCardDescriptionOutput> {
  return refineCardDescriptionFlow(input);
}

const refineCardDescriptionPrompt = ai.definePrompt({
  name: 'refineCardDescriptionPrompt',
  input: {schema: RefineCardDescriptionInputSchema},
  output: {schema: RefineCardDescriptionOutputSchema},
  prompt: `You are an AI assistant specialized in refining card descriptions for project management tools.
Your goal is to make card descriptions concise, understandable, and consistent.
Analyze the provided card description and provide an improved version.
If the description is lengthy, summarize it without losing crucial information.
If it contains ambiguous phrasing, clarify it.
Also, provide specific suggestions for further improvement, even if you make changes.
Finally, indicate whether the description was significantly improved (true) or if it was already good or only received minor tweaks (false).

Card Description:
{{{description}}}`,
});

const refineCardDescriptionFlow = ai.defineFlow(
  {
    name: 'refineCardDescriptionFlow',
    inputSchema: RefineCardDescriptionInputSchema,
    outputSchema: RefineCardDescriptionOutputSchema,
  },
  async (input) => {
    const {output} = await refineCardDescriptionPrompt(input);
    return output!;
  }
);
