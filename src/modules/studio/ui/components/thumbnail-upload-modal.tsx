"use client";

import { ResponsiveModal } from "@/components/responsive-modal";
import { UploadDropzone } from "@/lib/uploadthing";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";

interface ThumbnailUploadModalProps {
  videoId: string;
  open: boolean;
  onOpenChangeAction: (open?: boolean) => void;
}

export const ThumbnailUploadModal = ({
  videoId,
  open,
  onOpenChangeAction,
}: ThumbnailUploadModalProps) => {
  const utils = trpc.useUtils();

  const onUploadComplete = () => {
    utils.studio.getMany.invalidate();
    utils.studio.getOne.invalidate({ id: videoId });
    toast.success("Thumbnail updated successfully");
    onOpenChangeAction(false);
  };
  return (
    <ResponsiveModal
      title="Upload a thumbnail"
      open={open}
      onOpenChange={onOpenChangeAction}
    >
      <UploadDropzone
        endpoint="thumbnailUploader"
        input={{ videoId }}
        onClientUploadComplete={onUploadComplete}
        className="border border-blue-400"
      />
    </ResponsiveModal>
  );
};
