'use server';
/**
 * @fileOverview An AI agent for assessing the relevance of evidence text against card details.
 *
 * - assessEvidenceRelevance - A function that handles the evidence relevance assessment process.
 * - AssessEvidenceRelevanceInput - The input type for the assessEvidenceRelevance function.
 * - AssessEvidenceRelevanceOutput - The return type for the assessEvidenceRelevance function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AssessEvidenceRelevanceInputSchema = z.object({
  cardTitle: z.string().describe("The title of the card."),
  cardDescription: z.string().optional().describe("The description of the card."),
  checklistItems: z.array(z.string()).describe("A list of checklist items for the card."),
  evidenceText: z.string().describe("The evidence text provided when closing the card."),
});
export type AssessEvidenceRelevanceInput = z.infer<typeof AssessEvidenceRelevanceInputSchema>;

const AssessEvidenceRelevanceOutputSchema = z.object({
  relevanceScore: z.number().min(0).max(100).describe("A relevance score from 0 (not relevant) to 100 (highly relevant)."),
  feedback: z.string().describe("Detailed feedback explaining the relevance score and how well the evidence covers the card details."),
});
export type AssessEvidenceRelevanceOutput = z.infer<typeof AssessEvidenceRelevanceOutputSchema>;

export async function assessEvidenceRelevance(input: AssessEvidenceRelevanceInput): Promise<AssessEvidenceRelevanceOutput> {
  return assessEvidenceRelevanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assessEvidenceRelevancePrompt',
  input: { schema: AssessEvidenceRelevanceInputSchema },
  output: { schema: AssessEvidenceRelevanceOutputSchema },
  prompt: `You are an AI assistant designed to assess the relevance of provided evidence text for completing a task (card).
Your goal is to compare the 'Evidence Text' with the 'Card Details' (title, description, and checklist items) and provide a relevance score (0-100, where 100 is highly relevant) and detailed feedback on why the evidence is relevant or not.

Card Details:
Title: {{{cardTitle}}}
Description: {{{cardDescription}}}
Checklist Items:
{{#each checklistItems}}
- {{{this}}}
{{/each}}

Evidence Text:
{{{evidenceText}}}

Provide your assessment in a JSON object with the following structure:
- 'relevanceScore': An integer between 0 and 100 representing the relevance.
- 'feedback': A string providing detailed explanation for the score and how well the evidence covers the card details.`,
});

const assessEvidenceRelevanceFlow = ai.defineFlow(
  {
    name: 'assessEvidenceRelevanceFlow',
    inputSchema: AssessEvidenceRelevanceInputSchema,
    outputSchema: AssessEvidenceRelevanceOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
