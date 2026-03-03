import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useOptimisticReaction } from "@/hooks/use-optimistic-reaction";
import { cn } from "@/lib/utils";
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { VideoGetOneOutput } from "../../types";

interface VideoReactionsProps {
  videoId: string;
  likes: number;
  dislikes: number;
  viewerReaction: VideoGetOneOutput["viewerReaction"];
}

export const VideoReactions = ({
  videoId,
  likes,
  dislikes,
  viewerReaction,
}: VideoReactionsProps) => {
  const {
    likeCount,
    dislikeCount,
    viewerReaction: optimisticReaction,
    handleLike,
    handleDislike,
  } = useOptimisticReaction(videoId, {
    id: videoId,
    likeCount: likes,
    dislikeCount: dislikes,
    viewerReaction,
  } as VideoGetOneOutput);

  return (
    <div className="flex items-center flex-none">
      <Button
        className="rounded-l-full rounded-r-none gap-2 pr-4"
        variant="secondary"
        onClick={handleLike}
      >
        <ThumbsUpIcon
          className={cn(
            "size-5",
            optimisticReaction === "like" && "fill-black dark:fill-white",
          )}
        />
        {likeCount}
      </Button>
      <Separator orientation="vertical" className="h-7" />
      <Button
        onClick={handleDislike}
        className="rounded-l-none rounded-r-full gap-2 pr-4"
        variant="secondary"
      >
        <ThumbsDownIcon
          className={cn(
            "size-5",
            optimisticReaction === "dislike" && "fill-black dark:fill-white",
          )}
        />
        {dislikeCount}
      </Button>
    </div>
  );
};
