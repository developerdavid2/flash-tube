"use client";

import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { LoaderIcon } from "lucide-react";

interface VideoDeleteModalProps {
  open: boolean;
  onOpenChangeAction: () => void;
  onDeleteAction: () => void;
  videoTitle?: string | null;
  disabled?: boolean;
}

export const VideoDeleteModal = ({
  open,
  onOpenChangeAction,
  onDeleteAction,
  videoTitle,
  disabled,
}: VideoDeleteModalProps) => {
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChangeAction}
      title="Are you sure?"
    >
      <div className="px-4 lg:px-0 pb-4 space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Do you want to delete{" "}
            <span className="font-medium text-foreground">
              {videoTitle ? `"${videoTitle}"` : "this video"}
            </span>
            ? This action is irreversible.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onOpenChangeAction}
            disabled={disabled}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onDeleteAction}
            disabled={disabled}
          >
            {disabled ? (
              <>
                <LoaderIcon className="animate-spin" />
                Deleting...
              </>
            ) : (
              <>Delete</>
            )}
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
};
