"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { useClerk } from "@clerk/nextjs";
import { toast } from "sonner";

interface UseOptimisticSubscriptionProps {
  userId: string;
  initialIsSubscribed: boolean;
  initialSubscriberCount: number;
  fromVideoId?: string;
}

export function useOptimisticSubscription({
  userId,
  initialIsSubscribed,
  initialSubscriberCount,
  fromVideoId,
}: UseOptimisticSubscriptionProps) {
  const clerk = useClerk();
  const utils = trpc.useUtils();

  const [isSubscribed, setIsSubscribed] = useState(initialIsSubscribed);
  const [subscriberCount, setSubscriberCount] = useState(
    initialSubscriberCount,
  );

  const subscribe = trpc.subscriptions.create.useMutation({
    onError: (error) => {
      // Roll back on failure
      setIsSubscribed(false);
      setSubscriberCount((c) => Math.max(0, c - 1));
      toast.error("Something went wrong");
      if (error.data?.code === "UNAUTHORIZED") clerk.openSignIn();
    },
    onSuccess: () => {
      utils.users.getOne.invalidate({ id: userId });
      utils.videos.getManySubscribed.invalidate();
      if (fromVideoId) utils.videos.getOne.invalidate({ id: fromVideoId });
    },
  });

  const unsubscribe = trpc.subscriptions.remove.useMutation({
    onError: (error) => {
      // Roll back on failure
      setIsSubscribed(true);
      setSubscriberCount((c) => c + 1);
      toast.error("Something went wrong");
      if (error.data?.code === "UNAUTHORIZED") clerk.openSignIn();
    },
    onSuccess: () => {
      utils.users.getOne.invalidate({ id: userId });
      utils.videos.getManySubscribed.invalidate();
      if (fromVideoId) utils.videos.getOne.invalidate({ id: fromVideoId });
    },
  });

  const handleToggle = () => {
    if (isSubscribed) {
      setIsSubscribed(false);
      setSubscriberCount((c) => Math.max(0, c - 1));
      unsubscribe.mutate({ userId });
    } else {
      setIsSubscribed(true);
      setSubscriberCount((c) => c + 1);
      subscribe.mutate({ userId });
    }
  };

  return {
    isSubscribed,
    subscriberCount,
    handleToggle,
  };
}
