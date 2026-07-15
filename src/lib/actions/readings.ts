"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { readingSchema, toReadingRow, type ReadingFormInput } from "@/lib/validations";

export type ActionResult =
  | { success: true; id: string }
  | { success: false; error: string };

export type CreateReadingMeta = {
  source?: "manual" | "ocr";
  image_path?: string | null;
};

export async function createReading(
  input: ReadingFormInput,
  meta?: CreateReadingMeta
): Promise<ActionResult> {
  const parsed = readingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid reading" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not signed in" };
  }

  const { data, error } = await supabase
    .from("readings")
    .insert({
      ...toReadingRow(parsed.data),
      user_id: user.id,
      source: meta?.source ?? "manual",
      image_path: meta?.image_path ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Failed to save reading" };
  }

  revalidatePath("/readings");
  revalidatePath("/");

  return { success: true, id: data.id };
}

export async function updateReading(
  id: string,
  input: ReadingFormInput
): Promise<ActionResult> {
  const parsed = readingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid reading" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not signed in" };
  }

  const { error } = await supabase
    .from("readings")
    .update(toReadingRow(parsed.data))
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/readings");
  revalidatePath(`/readings/${id}`);
  revalidatePath("/");

  return { success: true, id };
}

export async function deleteReading(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not signed in" };
  }

  const { error } = await supabase
    .from("readings")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/readings");
  revalidatePath("/");

  return { success: true, id };
}
