"use client";

import { useOptimistic, useTransition } from "react";
import { VideoGetOneOutput } from "@/modules/videos/types";
import { trpc } from "@/trpc/client";
import { useClerk } from "@clerk/nextjs";

type ReactionType = "like" | "dislike" | null;

interface OptimisticState {
  likeCount: number;
  dislikeCount: number;
  viewerReaction: ReactionType;
}

type ReactionAction = {
  type: "like" | "dislike";
};

export function useOptimisticReaction(
  videoId: string,
  initialData: VideoGetOneOutput,
) {
  const clerk = useClerk();
  const utils = trpc.useUtils();
  const [isPending, startTransition] = useTransition();

  const [optimisticState, setOptimisticState] = useOptimistic(
    {
      likeCount: initialData.likeCount,
      dislikeCount: initialData.dislikeCount,
      viewerReaction: initialData.viewerReaction,
    } as OptimisticState,
    (state, action: ReactionAction) => {
      const newState = { ...state };

      if (action.type === "like") {
        if (state.viewerReaction === "like") {
          newState.likeCount--;
          newState.viewerReaction = null;
        } else if (state.viewerReaction === "dislike") {
          newState.dislikeCount--;
          newState.likeCount++;
          newState.viewerReaction = "like";
        } else {
          newState.likeCount++;
          newState.viewerReaction = "like";
        }
      } else if (action.type === "dislike") {
        if (state.viewerReaction === "dislike") {
          newState.dislikeCount--;
          newState.viewerReaction = null;
        } else if (state.viewerReaction === "like") {
          newState.likeCount--;
          newState.dislikeCount++;
          newState.viewerReaction = "dislike";
        } else {
          newState.dislikeCount++;
          newState.viewerReaction = "dislike";
        }
      }

      return newState;
    },
  );

  const like = trpc.videoReactions.like.useMutation({
    onError: (error) => {
      utils.videos.getOne.invalidate({ id: videoId });
      if (error.data?.code === "UNAUTHORIZED") clerk.openSignIn();
    },
  });

  const dislike = trpc.videoReactions.dislike.useMutation({
    onError: (error) => {
      utils.videos.getOne.invalidate({ id: videoId });
      if (error.data?.code === "UNAUTHORIZED") clerk.openSignIn();
    },
  });

  const handleLike = () => {
    if (isPending) return;
    startTransition(async () => {
      try {
        setOptimisticState({ type: "like" });
        await like.mutateAsync({ videoId });
        await utils.videos.getOne.invalidate({ id: videoId });
        await utils.playlists.getLiked.invalidate();
      } catch {
        utils.videos.getOne.invalidate({ id: videoId });
      }
    });
  };

  const handleDislike = () => {
    if (isPending) return;
    startTransition(async () => {
      try {
        setOptimisticState({ type: "dislike" });
        await dislike.mutateAsync({ videoId });
        await utils.videos.getOne.invalidate({ id: videoId });
        await utils.playlists.getLiked.invalidate();
      } catch {
        utils.videos.getOne.invalidate({ id: videoId });
      }
    });
  };

  return {
    likeCount: optimisticState.likeCount,
    dislikeCount: optimisticState.dislikeCount,
    viewerReaction: optimisticState.viewerReaction,
    handleLike,
    handleDislike,
  };
}
