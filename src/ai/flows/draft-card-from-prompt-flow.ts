'use server';
/**
 * @fileOverview This file implements a Genkit flow for drafting Kanban cards from natural language prompts.
 *
 * - draftCardFromPrompt - A function that handles the card drafting process.
 * - DraftCardFromPromptInput - The input type for the draftCardFromPrompt function.
 * - DraftCardFromPromptOutput - The return type for the draftCardFromPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DraftCardFromPromptInputSchema = z.object({
  prompt: z.string().describe('Natural language request to draft a card.'),
});
export type DraftCardFromPromptInput = z.infer<typeof DraftCardFromPromptInputSchema>;

const DraftCardFromPromptOutputSchema = z.object({
  title: z.string().describe('The title of the card.'),
  description: z.string().describe('A detailed description for the card, potentially in markdown format.'),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']).describe('The priority of the card. P0 is highest, P3 is lowest.'),
  checklist: z.array(z.string()).describe('An array of suggested checklist items for the card.'),
});
export type DraftCardFromPromptOutput = z.infer<typeof DraftCardFromPromptOutputSchema>;

export async function draftCardFromPrompt(input: DraftCardFromPromptInput): Promise<DraftCardFromPromptOutput> {
  return draftCardFromPromptFlow(input);
}

const draftCardPrompt = ai.definePrompt({
  name: 'draftCardPrompt',
  input: {schema: DraftCardFromPromptInputSchema},
  output: {schema: DraftCardFromPromptOutputSchema},
  prompt: `You are an AI assistant tasked with drafting a Kanban card based on a natural language request.
Your goal is to extract key information and structure it into a card.

Here is the user's request:
{{{prompt}}}

Based on the request, generate the card details, ensuring all fields are populated appropriately.
The description can be detailed and use markdown if necessary.
The priority should be one of 'P0', 'P1', 'P2', or 'P3'.
The checklist should be a list of actionable items.`,
});

const draftCardFromPromptFlow = ai.defineFlow(
  {
    name: 'draftCardFromPromptFlow',
    inputSchema: DraftCardFromPromptInputSchema,
    outputSchema: DraftCardFromPromptOutputSchema,
  },
  async input => {
    const {output} = await draftCardPrompt(input);
    return output!;
  }
);
