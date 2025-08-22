'use server';

/**
 * @fileOverview This flow uses randomly taken photos to verify if the user is working.
 *
 * - verifyWorking - A function that handles the verification process.
 * - VerifyWorkingInput - The input type for the verifyWorking function.
 * - VerifyWorkingOutput - The return type for the verifyWorking function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VerifyWorkingInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>' indicating the user's current work situation."
    ),
  previousTasks: z.array(z.string()).optional().describe('A list of previous tasks the user has worked on.'),
});
export type VerifyWorkingInput = z.infer<typeof VerifyWorkingInputSchema>;

const VerifyWorkingOutputSchema = z.object({
  isWorking: z.boolean().describe('Whether the user is likely working based on the photo.'),
  confidence: z.number().describe('A confidence score between 0 and 1 indicating the certainty of the assessment.'),
  details: z.string().describe('Additional details about the assessment.'),
});
export type VerifyWorkingOutput = z.infer<typeof VerifyWorkingOutputSchema>;

export async function verifyWorking(input: VerifyWorkingInput): Promise<VerifyWorkingOutput> {
  return verifyWorkingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifyWorkingPrompt',
  input: {schema: VerifyWorkingInputSchema},
  output: {schema: VerifyWorkingOutputSchema},
  prompt: `You are an AI assistant designed to analyze images and determine if a user is currently working.

Analyze the following photo and provide a determination of whether the user is working or not. Provide a confidence score between 0 and 1.

Photo: {{media url=photoDataUri}}

Consider these previous tasks the user has worked on: {{#each previousTasks}}{{{this}}}, {{/each}}

Respond in JSON format.
`,
});

const verifyWorkingFlow = ai.defineFlow(
  {
    name: 'verifyWorkingFlow',
    inputSchema: VerifyWorkingInputSchema,
    outputSchema: VerifyWorkingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
