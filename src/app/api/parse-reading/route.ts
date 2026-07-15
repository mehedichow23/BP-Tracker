import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

import { OCR_FALLBACK_RESULT, OCR_SYSTEM_PROMPT, ocrResultSchema } from "@/lib/ocr";

const SUPPORTED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

// ~15MB decoded, matching the bp-images bucket's file_size_limit. Base64
// inflates by ~4/3, so cap the encoded string a bit above that.
const MAX_BASE64_LENGTH = 20_000_000;

function stripCodeFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const image = typeof body?.image === "string" ? body.image : null;
    const rawMediaType = typeof body?.media_type === "string" ? body.media_type : "";
    const mediaType = SUPPORTED_MEDIA_TYPES.includes(
      rawMediaType as (typeof SUPPORTED_MEDIA_TYPES)[number]
    )
      ? (rawMediaType as (typeof SUPPORTED_MEDIA_TYPES)[number])
      : "image/jpeg";

    if (!image || image.length > MAX_BASE64_LENGTH) {
      return NextResponse.json(OCR_FALLBACK_RESULT);
    }

    const anthropic = new Anthropic();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      thinking: { type: "disabled" },
      output_config: { effort: "low" },
      system: OCR_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: image },
            },
            {
              type: "text",
              text: "Read the values from this blood pressure monitor display and respond with the JSON object only.",
            },
          ],
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(OCR_FALLBACK_RESULT);
    }

    const cleaned = stripCodeFences(textBlock.text);
    const parsed = JSON.parse(cleaned);
    const result = ocrResultSchema.parse(parsed);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(OCR_FALLBACK_RESULT);
  }
}
