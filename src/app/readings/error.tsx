"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/error-state";

export default function ReadingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorState message="Couldn't load your readings." onRetry={reset} />;
}
