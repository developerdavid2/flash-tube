import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { useAuth, useClerk } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MessageSquare,
  MoreVerticalIcon,
  PencilIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Comment } from "../../types";
import { CommentForm } from "./comment-form";
import { CommentReplies } from "./comment-replies";

interface CommentItemProps {
  comment: Comment;
  variant?: "reply" | "comment";
}

export const CommentItem = ({
  comment,
  variant = "comment",
}: CommentItemProps) => {
  const { userId } = useAuth();
  const clerk = useClerk();
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isRepliesOpen, setIsRepliesOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const utils = trpc.useUtils();

  const remove = trpc.comments.remove.useMutation({
    onSuccess: (data) => {
      if (data.type === "soft") {
        toast.success("Comment removed");
      } else {
        toast.success("Comment deleted");
      }
      utils.comments.getMany.invalidate({ videoId: comment.videoId });
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const like = trpc.commentReactions.like.useMutation({
    onSuccess: () => {
      utils.comments.getMany.invalidate({ videoId: comment.videoId });
    },
    onError: (error) => {
      toast.error("Something went wrong");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const dislike = trpc.commentReactions.dislike.useMutation({
    onSuccess: () => {
      utils.comments.getMany.invalidate({ videoId: comment.videoId });
    },
    onError: (error) => {
      toast.error("Something went wrong");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const isPending = remove.isPending || like.isPending || dislike.isPending;
  const isOwner = userId === comment.user.clerkId;
  const isDeleted = comment.isDeleted;

  if (isEditing) {
    return (
      <div className="pl-14">
        <CommentForm
          variant="edit"
          videoId={comment.videoId}
          editCommentId={comment.id}
          editInitialValue={comment.value}
          onSuccess={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <Link href={`/users/${comment.userId}`}>
          <UserAvatar
            size={variant === "comment" ? "md" : "sm"}
            imageUrl={comment.user.imageUrl}
            name={comment.user.name || "User"}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/users/${comment.userId}`}>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-sm pb-0.5">
                {comment.user.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                {comment.isEdited && !isDeleted && " (edited)"}
              </span>
            </div>
          </Link>

          {/* Comment content */}
          <p
            className={cn(
              "text-sm",
              isDeleted && "text-muted-foreground italic",
            )}
          >
            {isDeleted ? "[deleted]" : comment.value}
          </p>

          {/* Reactions - hide if deleted */}
          {!isDeleted && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center">
                <Button
                  className="size-8"
                  size="icon"
                  disabled={isPending}
                  variant="ghost"
                  onClick={() => like.mutate({ commentId: comment.id })}
                >
                  <ThumbsUpIcon
                    className={cn(
                      "size-4",
                      comment.viewerCommentReaction === "like" && "fill-black",
                    )}
                  />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {comment.likeCount}
                </span>
                <Button
                  className="size-8"
                  size="icon"
                  disabled={isPending}
                  variant="ghost"
                  onClick={() => dislike.mutate({ commentId: comment.id })}
                >
                  <ThumbsDownIcon
                    className={cn(
                      "size-4",
                      comment.viewerCommentReaction === "dislike" &&
                        "fill-black",
                    )}
                  />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {comment.dislikeCount}
                </span>
              </div>
              {variant === "comment" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => setIsReplyOpen(true)}
                >
                  Reply
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Show menu for owner, or for non-deleted top-level comments (for reply option) */}
        {!isDeleted && (isOwner || variant === "comment") && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreVerticalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Reply option - only for non-deleted top-level comments */}
              {variant === "comment" && !isDeleted && (
                <DropdownMenuItem onClick={() => setIsReplyOpen(true)}>
                  <MessageSquare className="size-4" />
                  Reply
                </DropdownMenuItem>
              )}

              {/* Edit option - only for owner and non-deleted */}
              {isOwner && !isDeleted && (
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <PencilIcon className="size-4" />
                  Edit
                </DropdownMenuItem>
              )}

              {/* Delete option - only for owner and non-deleted */}
              {isOwner && !isDeleted && (
                <DropdownMenuItem
                  onClick={() => remove.mutate({ id: comment.id })}
                  className="text-destructive"
                >
                  <Trash2Icon className="size-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Reply form - only for non-deleted top-level comments */}
      {isReplyOpen && variant === "comment" && !isDeleted && (
        <div className="mt-4 pl-14">
          <CommentForm
            variant="reply"
            parentId={comment.id}
            videoId={comment.videoId}
            onSuccess={() => {
              setIsReplyOpen(false);
              setIsRepliesOpen(true);
            }}
            onCancel={() => setIsReplyOpen(false)}
          />
        </div>
      )}

      {/* Show replies button - visible even if parent is deleted, as long as there are replies */}
      {comment.replyCount > 0 && variant === "comment" && (
        <div className="pl-14 mt-2">
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => setIsRepliesOpen((current) => !current)}
          >
            {isRepliesOpen ? (
              <ChevronUpIcon className="size-4" />
            ) : (
              <ChevronDownIcon className="size-4" />
            )}
            {comment.replyCount}{" "}
            {comment.replyCount === 1 ? "reply" : "replies"}
          </Button>
        </div>
      )}

      {/* Replies list - visible even if parent is deleted */}
      {comment.replyCount > 0 && variant === "comment" && isRepliesOpen && (
        <CommentReplies parentId={comment.id} videoId={comment.videoId} />
      )}
    </div>
  );
};
