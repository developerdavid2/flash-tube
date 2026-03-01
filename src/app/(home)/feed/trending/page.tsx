// app/page.tsx
import { DEFAULT_LIMIT } from "@/constants";
import { HydrateClient, trpc } from "@/trpc/server";

export const dynamic = "force-dynamic";

const Page = async () => {
  // Prefetch on server
  void trpc.videos.getManyTrending.prefetchInfinite({ limit: DEFAULT_LIMIT });

  return (
    <HydrateClient>
      <TrendingView />
    </HydrateClient>
  );
};

export default Page;
