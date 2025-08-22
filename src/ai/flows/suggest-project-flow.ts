'use server';

/**
 * @fileOverview A project suggestion AI agent.
 *
 * - suggestProject - A function that suggests a project to log time to.
 * - SuggestProjectInput - The input type for the suggestProject function.
 * - SuggestProjectOutput - The return type for the suggestProject function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestProjectInputSchema = z.object({
  recentProjects: z.array(
    z.object({
      name: z.string().describe('The name of the project.'),
      date: z.string().describe('The date the project was last worked on (ISO format).'),
      client: z.string().describe('The client associated with the project.'),
    })
  ).describe('A list of recent projects with their names, dates, and clients.'),
  currentTaskDescription: z.string().describe('The description of the current task the user is working on.'),
});
export type SuggestProjectInput = z.infer<typeof SuggestProjectInputSchema>;

const SuggestProjectOutputSchema = z.object({
  suggestedProjectName: z.string().describe('The name of the suggested project to log time to.'),
  reason: z.string().describe('The reason for the suggestion.'),
});
export type SuggestProjectOutput = z.infer<typeof SuggestProjectOutputSchema>;

export async function suggestProject(input: SuggestProjectInput): Promise<SuggestProjectOutput> {
  return suggestProjectFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestProjectPrompt',
  input: {schema: SuggestProjectInputSchema},
  output: {schema: SuggestProjectOutputSchema},
  prompt: `You are an AI assistant that suggests which project a user should log their time to, based on their recent projects and current task description.

Recent Projects:
{{#each recentProjects}}
- Name: {{this.name}}, Date: {{this.date}}, Client: {{this.client}}
{{/each}}

Current Task Description: {{{currentTaskDescription}}}

Based on the recent projects and the current task description, suggest the most appropriate project to log time to. Explain your reasoning.
`, 
});

const suggestProjectFlow = ai.defineFlow(
  {
    name: 'suggestProjectFlow',
    inputSchema: SuggestProjectInputSchema,
    outputSchema: SuggestProjectOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
