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

