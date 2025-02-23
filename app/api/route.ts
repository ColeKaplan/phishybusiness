import { NextResponse } from "next/server";
import OpenAI from "openai";




export async function POST(request: Request) {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENAI_API_KEY,
  });


  try {
    const { transcript } = await request.json();
    console.log("Received transcript:", transcript);

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert in cybersecurity and social engineering, specifically trained to analyze phone call transcripts for potential phishing attempts. 
                    You will receive transcripts of phone calls where a user is being tested on their ability to detect phishing. Your job is to break down the call, identify key mistakes the user made, 
                    highlight potential risks of sharing certain details, and provide clear guidance on how to improve. 

                    Return the response as a JSON object with the following format:
                    {
                      "mistakes": ["mistake 1", "mistake 2"],
                      "risks": ["risk 1", "risk 2"],
                      "bestPractices": ["tip 1", "tip 2"]
                    }

                    IMPORTANT: Return only raw JSON. Do not include any additional formatting, Markdown, or text outside the JSON object.

                    ADDITIONAL INSTRUCTIONS:
                    1. If the user hangs up immediately, highlight that it is a good practice to hang up early against scammers. Add this as a "bestPractice" and add under "mistakes" and also under "risks" that no mistakes were made.
                    2. If the user says something that demonstrates good practice, quote what they said and highlight its effectiveness as a "bestPractice".
                    3. If the user gives in after pressure, remind them that it is okay to hang up or refuse someone on the phone. Add this as a "bestPractice" and include the risks of succumbing to pressure.
                    4. Tailor the response to the specific transcript. Be concise and actionable.`
        },
        {
          role: "user",
          content: `Here is a transcript of a phone call where I was tested on my ability to detect phishing. Please analyze it and provide feedback on mistakes I made, potential risks, and best practices for handling such situations.\n\n ${transcript}`
        },
      ],
    });

    console.log("OpenAI API response:", completion);

    const responseContent =
      completion.choices[0]?.message?.content || "No response generated.";

    return NextResponse.json({ response: responseContent });
  } catch (error) {
    console.error("Error generating analysis:", error);
    return NextResponse.json(
      { error: "Failed to generate analysis." },
      { status: 500 }
    );
  }
}

