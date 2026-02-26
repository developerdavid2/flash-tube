// app/videos/[videoId]/page.tsx

import { DEFAULT_LIMIT } from "@/constants";
import { VideoView } from "@/modules/videos/ui/views/video-view";
import { HydrateClient, trpc } from "@/trpc/server";
import { notFound } from "next/navigation";
import { z } from "zod";

interface PageProps {
  params: Promise<{
    videoId: string;
  }>;
}

const Page = async ({ params }: PageProps) => {
  const { videoId } = await params;

  // ✅ Validate UUID before doing anything
  const uuidSchema = z.string().uuid();
  const validation = uuidSchema.safeParse(videoId);

  if (!validation.success) {
    // Not a valid UUID (like "logo.png") → return 404
    notFound();
  }

  // Now safe to prefetch
  void trpc.videos.getOne.prefetch({ id: videoId });
  void trpc.comments.getMany.prefetchInfinite({
    videoId,
    limit: DEFAULT_LIMIT,
  });
  void trpc.suggestions.getMany.prefetchInfinite({
    videoId,
    limit: DEFAULT_LIMIT,
  });

  return (
    <HydrateClient>
      <VideoView videoId={videoId} />
    </HydrateClient>
  );
};

export default Page;
