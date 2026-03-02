import { VideoGetOneOutput } from "@/modules/videos/types";
import { trpc } from "@/trpc/client";
import { useClerk } from "@clerk/nextjs";
import { toast } from "sonner";

export function useOptimisticReaction(videoId: string) {
  const clerk = useClerk();
  const utils = trpc.useUtils();

  const like = trpc.videoReactions.like.useMutation({
    async onMutate() {
      await utils.videos.getOne.cancel({ id: videoId });
      const previousData = utils.videos.getOne.getData({ id: videoId });

      // Optimistically update
      utils.videos.getOne.setData({ id: videoId }, (old) => {
        if (!old) return old;

        let newLikes = old.likeCount;
        let newDislikes = old.dislikeCount;
        let newReaction: VideoGetOneOutput["viewerReaction"];

        if (old.viewerReaction === "like") {
          newLikes--;
          newReaction = null;
        } else if (old.viewerReaction === "dislike") {
          newLikes++;
          newDislikes--;
          newReaction = "like";
        } else {
          newLikes++;
          newReaction = "like";
        }

        return {
          ...old,
          likes: newLikes,
          dislikes: newDislikes,
          viewerReaction: newReaction,
        };
      });

      return { previousData };
    },

    onError(error, _, context) {
      toast.error("Failed to update reaction");

      if (context?.previousData) {
        utils.videos.getOne.setData({ id: videoId }, context.previousData);
      }

      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },

    onSettled() {
      utils.videos.getOne.invalidate({ id: videoId });
      utils.playlists.getLiked.invalidate();
    },
  });

  const dislike = trpc.videoReactions.dislike.useMutation({
    async onMutate() {
      await utils.videos.getOne.cancel({ id: videoId });
      const previousData = utils.videos.getOne.getData({ id: videoId });

      utils.videos.getOne.setData({ id: videoId }, (old) => {
        if (!old) return old;

        let newLikes = old.likeCount;
        let newDislikes = old.dislikeCount;
        let newReaction: VideoGetOneOutput["viewerReaction"];

        if (old.viewerReaction === "dislike") {
          newDislikes--;
          newReaction = null;
        } else if (old.viewerReaction === "like") {
          newLikes--;
          newDislikes++;
          newReaction = "dislike";
        } else {
          newDislikes++;
          newReaction = "dislike";
        }

        return {
          ...old,
          likes: newLikes,
          dislikes: newDislikes,
          viewerReaction: newReaction,
        };
      });

      return { previousData };
    },

    onError(error, variables, context) {
      toast.error("Failed to update reaction");

      if (context?.previousData) {
        utils.videos.getOne.setData({ id: videoId }, context.previousData);
      }

      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },

    onSettled() {
      utils.videos.getOne.invalidate({ id: videoId });
      utils.playlists.getLiked.invalidate();
    },
  });

  return { like, dislike };
}
