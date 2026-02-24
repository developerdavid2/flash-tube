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
  const { like, dislike } = useOptimisticReaction(videoId);
  return (
    <div className="flex items-center flex-none">
      <Button
        className="rounded-l-full rounded-r-none gap-2 pr-4"
        variant="secondary"
        disabled={like.isPending || dislike.isPending}
        onClick={() => like.mutate({ videoId })}
      >
        <ThumbsUpIcon
          className={cn("size-5", viewerReaction === "like" && "fill-black")}
        />
        {likes}
      </Button>
      <Separator orientation="vertical" className="h-7" />
      <Button
        disabled={like.isPending || dislike.isPending}
        onClick={() => dislike.mutate({ videoId })}
        className="rounded-l-none rounded-r-full gap-2 pr-4"
        variant="secondary"
      >
        <ThumbsDownIcon
          className={cn("size-5", viewerReaction === "dislike" && "fill-black")}
        />
        {dislikes}
      </Button>
    </div>
  );
};
