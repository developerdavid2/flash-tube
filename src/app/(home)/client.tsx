"use client";

import { trpc } from "@/trpc/client";

export const PageClient = () => {
  const [data] = trpc.hello.useSuspenseQuery({ text: "Jacobs" });

  return <p>Page says :{data.greeting}</p>;
};
