import OpenAI from "openai";
import { z } from "zod";

if (!process.env.DEEPSEEK_API_KEY) {
  throw new Error(
    "DEEPSEEK_API_KEY environment variable must be set for AI features to work"
  );
}

const deepseek = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
  timeout: 30000, // 30 second timeout
  maxRetries: 2,
});

const taskBreakdownSchema = z.object({
  projectSummary: z.string(),
  totalBudget: z.string(),
  tasks: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      skills: z.array(z.enum(["logic", "creative", "technical", "communication"])),
      estimatedTime: z.string(),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]),
      budget: z.string(),
    })
  ),
});

export type TaskBreakdown = z.infer<typeof taskBreakdownSchema>;

export async function analyzeAndBreakdownDemand(
  demandText: string
): Promise<TaskBreakdown> {
  const systemPrompt = `You are an AI assistant specialized in analyzing project demands and breaking them down into actionable micro-tasks.

Your job is to:
1. Understand the user's natural language demand description
2. Break it down into specific, actionable micro-tasks
3. For each task, identify:
   - Clear title and description
   - Required skills (choose from: logic, creative, technical, communication)
   - Estimated time to complete (e.g., "2 hours", "1 day", "3 days")
   - Difficulty level (beginner, intermediate, advanced)
   - Suggested budget in USD

4. Provide a project summary and total budget estimate

Return your response as a JSON object with this exact structure:
{
  "projectSummary": "Brief overview of the entire project",
  "totalBudget": "Total estimated budget in USD",
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed task description",
      "skills": ["skill1", "skill2"],
      "estimatedTime": "time estimate",
      "difficulty": "beginner|intermediate|advanced",
      "budget": "budget in USD"
    }
  ]
}

Important:
- Skills must be one or more of: logic, creative, technical, communication
- Difficulty must be exactly: beginner, intermediate, or advanced
- Make tasks specific and actionable
- Budget should be realistic based on task complexity`;

  const completion = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: demandText },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const responseText = completion.choices[0].message.content;
  if (!responseText) {
    throw new Error("No response from DeepSeek API");
  }

  try {
    const parsed = JSON.parse(responseText);
    const validated = taskBreakdownSchema.parse(parsed);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`AI response validation failed: ${error.errors[0].message}`);
    }
    throw new Error("Failed to parse AI response");
  }
}

const challengeContentSchema = z.object({
  title: z.string(),
  description: z.string(),
  content: z.any(),
  duration: z.string(),
  points: z.number(),
});

const evaluationSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string(),
});

export async function generateChallengeContent(
  skillType: "logic" | "creative" | "technical" | "communication",
  difficulty: "easy" | "medium" | "hard"
): Promise<z.infer<typeof challengeContentSchema>> {
  const systemPrompt = `You are an AI assistant specialized in creating skill assessment challenges.

Create a ${difficulty} level ${skillType} challenge that will help evaluate a person's capabilities.

Guidelines:
- Logic: Puzzles, problem-solving, pattern recognition
- Creative: Design tasks, ideation, storytelling
- Technical: Coding, system design, technical problem-solving
- Communication: Writing, presentation scenarios, conflict resolution

Return your response as a JSON object with this structure:
{
  "title": "Challenge title",
  "description": "What the challenge tests",
  "content": {
    "question": "The actual challenge question or prompt",
    "hints": ["hint1", "hint2"],
    "evaluationCriteria": ["criteria1", "criteria2"]
  },
  "duration": "Expected time (e.g., '15 minutes', '30 minutes')",
  "points": 100
}`;

  const completion = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Generate a ${difficulty} ${skillType} challenge`,
      },
    ],
    temperature: 0.8,
    response_format: { type: "json_object" },
  });

  const responseText = completion.choices[0].message.content;
  if (!responseText) {
    throw new Error("No response from DeepSeek API");
  }

  try {
    const parsed = JSON.parse(responseText);
    const validated = challengeContentSchema.parse(parsed);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`AI response validation failed: ${error.errors[0].message}`);
    }
    throw new Error("Failed to parse AI response");
  }
}

export async function evaluateChallengeResponse(
  challengeContent: any,
  userResponse: string
): Promise<z.infer<typeof evaluationSchema>> {
  const systemPrompt = `You are an AI evaluator assessing user responses to skill challenges.

Evaluate the user's response based on the challenge criteria and provide:
1. A score from 0-100
2. Constructive feedback

Be fair but thorough in your evaluation.`;

  const completion = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Challenge: ${JSON.stringify(challengeContent)}\n\nUser Response: ${userResponse}\n\nProvide score and feedback as JSON: {"score": number, "feedback": "text"}`,
      },
    ],
    temperature: 0.5,
    response_format: { type: "json_object" },
  });

  const responseText = completion.choices[0].message.content;
  if (!responseText) {
    throw new Error("No response from DeepSeek API");
  }

  try {
    const parsed = JSON.parse(responseText);
    const validated = evaluationSchema.parse(parsed);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`AI response validation failed: ${error.errors[0].message}`);
    }
    throw new Error("Failed to parse AI response");
  }
}
