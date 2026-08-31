import { streamText, createGateway } from "ai";

export const maxDuration = 60;

function getGateway() {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    throw new Error("AI_GATEWAY_API_KEY is not configured");
  }
  return createGateway({ apiKey });
}

export async function POST(req: Request) {
  try {
    const { jobDescription, currentBody, systemPrompt } = await req.json();

    if (!jobDescription) {
      return Response.json({ error: "jobDescription is required" }, { status: 400 });
    }

    const gateway = getGateway();
    const defaultSystemPrompt = `You are an expert career coach and email copywriter.
Your task is to tailor the provided email body for a specific job application based on the provided job description.
Follow these rules:
1. Keep the tone professional, confident, and concise.
2. Highlight how the applicant's skills align with the job description.
3. Do not invent any new experiences or skills not implied by the existing email or standard for the role.
4. Output ONLY the new email body. Do not include subject lines, placeholders for names (unless they exist in the original), or any conversational filler like "Here is the revised email:".`;

    const result = streamText({
      model: gateway("minimax/minimax-m3"),
      providerOptions: {
        gateway: {
          order: ["gmicloud"],
        },
      },
      system: systemPrompt || defaultSystemPrompt,
      prompt: `Original Email Body:\n${currentBody || 'I am writing to apply for the open position at your company.'}\n\nJob Description:\n${jobDescription}\n\nPlease tailor the email body to this job description.`,
    });

    return result.toDataStreamResponse();
  } catch (error: unknown) {
    console.error("AI Tailor Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Something went wrong while generating the response.";
    return Response.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
