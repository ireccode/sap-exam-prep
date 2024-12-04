import OpenAI from 'openai';

export class AIService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async getExplanation(question: string, context: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert SAP Architect helping students prepare for certification exams."
        },
        {
          role: "user",
          content: `Question: ${question}\nContext: ${context}\nPlease explain this concept in detail.`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content || "No explanation available.";
  }
}