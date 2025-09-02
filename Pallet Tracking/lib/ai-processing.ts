import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const PalletAnalysisSchema = z.object({
  palletCount: z.number().min(0).describe("Number of pallets detected in the image"),
  confidence: z.number().min(0).max(1).describe("Confidence level of the detection (0-1)"),
  reasoning: z.string().describe("Brief explanation of how the count was determined"),
  additionalNotes: z.string().optional().describe("Any additional observations about the image"),
})

export type PalletAnalysis = z.infer<typeof PalletAnalysisSchema>

export async function analyzeBillOfLading(imageUrl: string): Promise<PalletAnalysis> {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: PalletAnalysisSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this Bill of Lading document and count the number of pallets mentioned. Look for pallet quantities, skid counts, or similar shipping unit information. Be precise and explain your reasoning.",
            },
            {
              type: "image",
              image: imageUrl,
            },
          ],
        },
      ],
    })

    return object
  } catch (error) {
    console.error("Error analyzing Bill of Lading:", error)
    // Return fallback analysis
    return {
      palletCount: 1,
      confidence: 0.1,
      reasoning: "Unable to analyze image automatically. Please verify count manually.",
      additionalNotes: "AI processing failed - manual verification required",
    }
  }
}
