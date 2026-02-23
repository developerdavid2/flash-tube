import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";

// TODO: Properly implement video reaction
export const VideoReactions = () => {
  const viewerReaction: "liked" | "disliked" = "liked";

  return (
    <div className="flex items-center flex-none">
      <Button
        className="rounded-l-full rounded-r-none gap-2 pr-4"
        variant="secondary"
      >
        <ThumbsUpIcon
          className={cn("size-5", viewerReaction === "liked" && "fill-black")}
        />
        {1}
      </Button>
      <Separator orientation="vertical" className="h-7" />
      <Button
        className="rounded-l-none rounded-r-full gap-2 pr-4"
        variant="secondary"
      >
        <ThumbsDownIcon
          className={cn("size-5", viewerReaction !== "liked" && "fill-black")}
        />
        {1}
      </Button>
    </div>
  );
};
