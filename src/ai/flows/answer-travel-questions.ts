// This file is machine-generated - edit with care!

'use server';

/**
 * @fileOverview A virtual travel assistant chatbot for answering questions about traveling in Hanoi.
 *
 * - answerTravelQuestions - A function that answers user questions about Hanoi travel.
 * - AnswerTravelQuestionsInput - The input type for the answerTravelQuestions function.
 * - AnswerTravelQuestionsOutput - The return type for the answerTravelQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerTravelQuestionsInputSchema = z.object({
  question: z.string().describe('The travel question from the user.'),
});
export type AnswerTravelQuestionsInput = z.infer<typeof AnswerTravelQuestionsInputSchema>;

const AnswerTravelQuestionsOutputSchema = z.object({
  answer: z.string().describe('The answer to the travel question.'),
});
export type AnswerTravelQuestionsOutput = z.infer<typeof AnswerTravelQuestionsOutputSchema>;

export async function answerTravelQuestions(input: AnswerTravelQuestionsInput): Promise<AnswerTravelQuestionsOutput> {
  return answerTravelQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerTravelQuestionsPrompt',
  input: {schema: AnswerTravelQuestionsInputSchema},
  output: {schema: AnswerTravelQuestionsOutputSchema},
  prompt: `You are a virtual travel assistant chatbot specializing in Hanoi, Vietnam.

  Answer the following question about traveling in Hanoi:

  {{question}}
  `,
});

const answerTravelQuestionsFlow = ai.defineFlow(
  {
    name: 'answerTravelQuestionsFlow',
    inputSchema: AnswerTravelQuestionsInputSchema,
    outputSchema: AnswerTravelQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
