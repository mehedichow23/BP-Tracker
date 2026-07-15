"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createReading, updateReading } from "@/lib/actions/readings";
import { toDatetimeLocal } from "@/lib/dates";
import { readingSchema, type ReadingFormInput } from "@/lib/validations";

type ReadingFormProps =
  | {
      mode: "create";
      defaultValues?: ReadingFormInput;
      imagePreviewUrl?: string | null;
      imagePath?: string | null;
      source?: "manual" | "ocr";
      confidenceWarning?: boolean;
      ocrUnreadableNote?: boolean;
    }
  | {
      mode: "edit";
      readingId: string;
      defaultValues: ReadingFormInput;
    };

const emptyDefaults: ReadingFormInput = {
  systolic: "",
  diastolic: "",
  pulse: "",
  taken_at: "",
  notes: "",
};

export function ReadingForm(props: ReadingFormProps) {
  const router = useRouter();
  const form = useForm<ReadingFormInput>({
    resolver: zodResolver(readingSchema),
    defaultValues:
      props.defaultValues ?? { ...emptyDefaults, taken_at: toDatetimeLocal(new Date()) },
  });

  async function onSubmit(values: ReadingFormInput) {
    const result =
      props.mode === "edit"
        ? await updateReading(props.readingId, values)
        : await createReading(values, {
            source: props.source,
            image_path: props.imagePath,
          });

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(props.mode === "edit" ? "Reading updated" : "Reading saved");
    router.push(props.mode === "edit" ? `/readings/${result.id}` : "/readings");
    router.refresh();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
      >
        {props.mode === "create" && props.imagePreviewUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an optimizable remote asset
          <img
            src={props.imagePreviewUrl}
            alt="Captured reading"
            className="h-48 w-full rounded-lg border object-cover"
          />
        )}

        {props.mode === "create" && props.ocrUnreadableNote && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>The photo could not be read. Enter the values manually below.</span>
          </div>
        )}

        {props.mode === "create" && props.confidenceWarning && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>Please double check these values.</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="systolic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Systolic</FormLabel>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    className="h-14 text-center text-2xl"
                    placeholder="120"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="diastolic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Diastolic</FormLabel>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    className="h-14 text-center text-2xl"
                    placeholder="80"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="pulse"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pulse (optional)</FormLabel>
              <FormControl>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  className="h-14 text-center text-2xl"
                  placeholder="72"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="taken_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date and time</FormLabel>
              <FormControl>
                <Input type="datetime-local" className="h-12" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="lg"
          className="h-14 w-full text-base"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting
            ? "Saving..."
            : props.mode === "edit"
              ? "Save changes"
              : "Save reading"}
        </Button>
      </form>
    </Form>
  );
}
