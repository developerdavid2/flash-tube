import { HydrateClient, trpc } from "@/trpc/server";
import { Suspense } from "react";
import { PageClient } from "./client";
import { ErrorBoundary } from "react-error-boundary";

export default async function Home() {
  await trpc.hello.prefetch({ text: "Jacobs" });

  return (
    <HydrateClient>
      <Suspense fallback={<p>Loading...</p>}>
        <ErrorBoundary fallback={<p>Error</p>}>
          <PageClient />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
}
