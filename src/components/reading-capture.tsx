"use client";

import { Camera, ImageIcon, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ReadingForm } from "@/components/reading-form";
import { toDatetimeLocal } from "@/lib/dates";
import { OCR_FALLBACK_RESULT, ocrResultSchema, type OcrResult } from "@/lib/ocr";
import { fileToBase64, uploadReadingImage } from "@/lib/storage";
import type { ReadingFormInput } from "@/lib/validations";

type Step = "capture" | "processing" | "confirm";

async function parseReadingPhoto(file: File): Promise<OcrResult> {
  const base64 = await fileToBase64(file);
  const response = await fetch("/api/parse-reading", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64, media_type: file.type }),
  });

  if (!response.ok) return OCR_FALLBACK_RESULT;

  const json = await response.json();
  return ocrResultSchema.parse(json);
}

function ocrToFormInput(result: OcrResult): ReadingFormInput {
  return {
    systolic: result.systolic !== null ? String(result.systolic) : "",
    diastolic: result.diastolic !== null ? String(result.diastolic) : "",
    pulse: result.pulse !== null ? String(result.pulse) : "",
    taken_at: toDatetimeLocal(new Date()),
    notes: "",
  };
}

export function ReadingCapture({ userId }: { userId: string }) {
  const [step, setStep] = useState<Step>("capture");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setStep("processing");

    const [uploadOutcome, ocrOutcome] = await Promise.allSettled([
      uploadReadingImage(file, userId),
      parseReadingPhoto(file),
    ]);

    if (uploadOutcome.status === "fulfilled") {
      setImagePath(uploadOutcome.value);
    } else {
      toast.error("Could not save the photo, continuing without it");
    }

    setOcrResult(
      ocrOutcome.status === "fulfilled" ? ocrOutcome.value : OCR_FALLBACK_RESULT
    );

    setStep("confirm");
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) handleFile(file);
  }

  if (step === "capture") {
    return (
      <div className="flex flex-col gap-4">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleInputChange}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
        />
        <Button
          size="lg"
          className="h-16 w-full text-base"
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera className="size-5" />
          Take Photo
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-14 w-full text-base"
          onClick={() => galleryInputRef.current?.click()}
        >
          <ImageIcon className="size-5" />
          Upload from gallery
        </Button>
        <button
          type="button"
          onClick={() => setStep("confirm")}
          className="pt-2 text-center text-sm text-muted-foreground underline underline-offset-4"
        >
          Enter manually instead
        </button>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an optimizable remote asset
          <img
            src={previewUrl}
            alt="Captured reading"
            className="h-48 w-full rounded-lg border object-cover"
          />
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Reading your photo...
        </div>
      </div>
    );
  }

  const allNull =
    ocrResult !== null &&
    ocrResult.systolic === null &&
    ocrResult.diastolic === null &&
    ocrResult.pulse === null;
  const viaPhoto = previewUrl !== null;

  return (
    <ReadingForm
      mode="create"
      defaultValues={ocrResult && !allNull ? ocrToFormInput(ocrResult) : undefined}
      imagePreviewUrl={previewUrl}
      imagePath={imagePath}
      source={viaPhoto ? "ocr" : "manual"}
      confidenceWarning={!allNull && !!ocrResult && ocrResult.confidence !== "high"}
      ocrUnreadableNote={viaPhoto && allNull}
    />
  );
}
