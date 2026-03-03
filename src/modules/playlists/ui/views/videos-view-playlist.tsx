import { PlaylistHeaderSection } from "../sections/playlist-header-section";
import { VideosSection } from "../sections/videos-section";

interface VideosViewPlaylistProps {
  playlistId: string;
}

export const VideosViewPlaylist = ({ playlistId }: VideosViewPlaylistProps) => {
  return (
    <div className="max-w-[2400px] mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6">
      <PlaylistHeaderSection playlistId={playlistId} />
      <VideosSection playlistId={playlistId} />
    </div>
  );
};
