"use client";

import { InfiniteScroll } from "@/components/infinite-scroll";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { DEFAULT_LIMIT } from "@/constants";
import { trpc } from "@/trpc/client";
import { Loader2Icon, SquareCheckIcon, SquareIcon } from "lucide-react";
import { toast } from "sonner";

interface PlaylistAddModalProps {
  videoId: string;
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
}

export const PlaylistAddModal = ({
  videoId,
  open,
  onOpenChangeAction,
}: PlaylistAddModalProps) => {
  const utils = trpc.useUtils();

  const {
    data: playlists,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = trpc.playlists.getManyForVideo.useInfiniteQuery(
    {
      videoId,
      limit: DEFAULT_LIMIT,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!videoId && open,
    },
  );

  const addVideo = trpc.playlists.addVideo.useMutation({
    onSuccess: () => {
      toast.success("Video added to playlist");
      utils.playlists.getMany.invalidate();
      utils.playlists.getManyForVideo.invalidate({ videoId });

      // TODO: invalidate playlists.getOne
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });
  const removeVideo = trpc.playlists.removeVideo.useMutation({
    onSuccess: () => {
      toast.success("Video removed from playlist");
      utils.playlists.getMany.invalidate();
      utils.playlists.getManyForVideo.invalidate({ videoId });
      // TODO: invalidate playlists.getOne
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const isPending = addVideo.isPending || removeVideo.isPending;

  return (
    <ResponsiveModal
      title="Add to playlist"
      open={open}
      onOpenChange={() => onOpenChangeAction(false)}
    >
      <div className="flex flex-col gap-2">
        {isLoading && (
          <div className="flex justify-center p-4">
            <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading &&
          playlists?.pages
            .flatMap((page) => page.items)
            .map((playlist) => (
              <Button
                key={playlist.id}
                className="w-full justify-start px-2 [&_svg]:size-5"
                size="lg"
                variant="ghost"
                onClick={() => {
                  if (playlist.containsVideo) {
                    removeVideo.mutate({ playlistId: playlist.id, videoId });
                  } else {
                    addVideo.mutate({ playlistId: playlist.id, videoId });
                  }
                }}
                disabled={isPending}
              >
                {playlist.containsVideo ? (
                  <SquareCheckIcon className="mr-2" />
                ) : (
                  <SquareIcon className="mr-2" />
                )}
                {playlist.name}
              </Button>
            ))}
        {!isLoading && (
          <InfiniteScroll
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            isManual
          />
        )}
      </div>
    </ResponsiveModal>
  );
};
