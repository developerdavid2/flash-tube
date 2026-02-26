import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
import { commentInsertSchema } from "@/db/schema";
import { trpc } from "@/trpc/client";
import { useClerk, useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

interface CommentFormProps {
  videoId: string;
  parentId?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
  variant?: "comment" | "reply" | "edit";
  editCommentId?: string;
  editInitialValue?: string;
}

const commentFormSchema = commentInsertSchema
  .omit({
    userId: true,
    id: true,
    createdAt: true,
    updatedAt: true,
    isDeleted: true,
    deletedAt: true,
    isEdited: true,
    editedAt: true,
  })
  .extend({
    value: z
      .string()
      .min(1, "Comment cannot be empty")
      .max(1000, "Comment too long"),
  });

type FormSchema = z.infer<typeof commentFormSchema>;

export const CommentForm = ({
  videoId,
  onSuccess,
  parentId,
  onCancel,
  variant = "comment",
  editCommentId,
  editInitialValue,
}: CommentFormProps) => {
  const { user } = useUser();
  const clerk = useClerk();
  const utils = trpc.useUtils();

  const form = useForm<FormSchema>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      parentId,
      videoId,
      value: editInitialValue || "",
    },
  });

  const createComment = trpc.comments.create.useMutation({
    onSuccess: () => {
      toast.success("Comment posted!");
      form.reset();
      utils.comments.getMany.invalidate({ videoId });
      utils.comments.getMany.invalidate({ videoId, parentId });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Something went wrong");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const updateComment = trpc.comments.update.useMutation({
    onSuccess: () => {
      toast.success("Comment updated!");
      form.reset();
      utils.comments.getMany.invalidate({ videoId });
      utils.comments.getMany.invalidate({ videoId, parentId });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update comment");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const onSubmit = (data: FormSchema) => {
    if (variant === "edit" && editCommentId) {
      // Update existing comment
      updateComment.mutate({
        id: editCommentId,
        value: data.value,
      });
    } else {
      // Create new comment
      createComment.mutate(data);
    }
  };

  const handleCancel = () => {
    form.reset();
    onCancel?.();
  };

  const isPending = createComment.isPending || updateComment.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-4 group">
        <UserAvatar
          size="sm"
          imageUrl={user?.imageUrl || "/user-placeholder.svg"}
          name={user?.username || "User"}
        />
        <div className="flex-1">
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={
                      variant === "reply"
                        ? "Reply to this comment..."
                        : variant === "edit"
                          ? "Edit your comment..."
                          : "Add a comment..."
                    }
                    className="resize-none bg-transparent overflow-hidden min-h-0"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="justify-end gap-2 mt-2 flex">
            {onCancel && (
              <Button
                variant="ghost"
                type="button"
                onClick={handleCancel}
                disabled={isPending}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !form.formState.isDirty}
            >
              {variant === "edit"
                ? "Save"
                : variant === "reply"
                  ? "Reply"
                  : "Comment"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};
