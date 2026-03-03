"use client";

import { ResponsiveModal } from "@/components/responsive-modal";
import { UploadDropzone } from "@/lib/uploadthing";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";

interface BannerUploadModalProps {
  userId: string;
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
}

export const BannerUploadModal = ({
  userId,
  open,
  onOpenChangeAction,
}: BannerUploadModalProps) => {
  const utils = trpc.useUtils();

  const onUploadComplete = () => {
    utils.users.getOne.invalidate({ id: userId });
    toast.success("Banner uploaded successfully");
    onOpenChangeAction(false);
  };
  return (
    <ResponsiveModal
      title="Upload a banner"
      open={open}
      onOpenChange={() => onOpenChangeAction(false)}
    >
      <UploadDropzone
        endpoint="bannerUploader"
        onClientUploadComplete={onUploadComplete}
        className="border border-blue-400"
      />
    </ResponsiveModal>
  );
};
