"use client";

import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { PlaylistCreateModal } from "../components/playlist-create-modal";
import { PlaylistsSection } from "../sections/playlists-videos-section";

export const PlaylistsView = () => {
  const [playlistCreateOpen, setPlaylistCreateOpen] = useState(false);

  return (
    <div className="max-w-[2400px] mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6">
      <PlaylistCreateModal
        open={playlistCreateOpen}
        onOpenChangeAction={() => setPlaylistCreateOpen(false)}
      />
      <div className="justify-between items-center flex">
        <div>
          <h1 className="text-2xl font-bold">Playlists</h1>
          <p className="text-xs text-muted-foreground">
            Collections you hace created
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={() => setPlaylistCreateOpen(true)}
        >
          <PlusIcon />
        </Button>
      </div>

      <PlaylistsSection />
    </div>
  );
};
