import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ReadingCapture } from "@/components/reading-capture";
import { getHouseholdContext } from "@/lib/household";

export default async function NewReadingPage() {
  const context = await getHouseholdContext();
  if (!context) redirect("/login");

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4">
      <Link
        href="/readings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ChevronLeft className="size-4" />
        Readings
      </Link>
      <h1 className="text-xl font-semibold">Take Reading</h1>
      <ReadingCapture userId={context.user.id} />
    </div>
  );
}
