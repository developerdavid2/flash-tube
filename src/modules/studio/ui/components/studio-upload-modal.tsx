"use client";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import { Loader2Icon, LoaderIcon, PlusIcon } from "lucide-react";
import { StudioUploader } from "./studio-uploader";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const StudioUploadModal = () => {
  const router = useRouter();
  const utils = trpc.useUtils();
  const create = trpc.videos.create.useMutation({
    onSuccess: async () => {
      await utils.studio.getMany.invalidate();
      toast.success("Video created succesfully");
    },
  });

  console.log("Create", create);
  const onSuccess = () => {
    if (!create.data?.video.id) return;

    create.reset();
    router.push(`/studio/videos/${create.data.video.id}`);
  };
  return (
    <>
      <ResponsiveModal
        title="Upload a video"
        open={!!create.data?.url}
        onOpenChange={() => create.reset()}
      >
        {create.data?.url ? (
          <StudioUploader endpoint={create.data.url} onSuccess={onSuccess} />
        ) : (
          <Loader2Icon />
        )}
      </ResponsiveModal>
      <Button
        variant="secondary"
        onClick={() => create.mutate()}
        disabled={create.isPending}
      >
        {create.isPending ? (
          <>
            <LoaderIcon className="animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <PlusIcon />
            Create
          </>
        )}
      </Button>
    </>
  );
};
