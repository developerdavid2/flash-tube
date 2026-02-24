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
  onSuccess?: () => void;
}

const commentFormSchema = commentInsertSchema
  .omit({
    userId: true,
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    value: z
      .string()
      .min(1, "Comment cannot be empty")
      .max(1000, "Comment too long"),
  });

type FormSchema = z.infer<typeof commentFormSchema>;

export const CommentForm = ({ videoId, onSuccess }: CommentFormProps) => {
  const { user } = useUser();
  const clerk = useClerk();
  const utils = trpc.useUtils();

  const form = useForm<FormSchema>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      videoId,
      value: "",
    },
  });

  const createComment = trpc.comments.create.useMutation({
    onSuccess: () => {
      toast.success("Comment posted!");
      form.reset();
      utils.comments.getMany.invalidate({ videoId });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Something went wrong");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const onSubmit = (data: FormSchema) => {
    createComment.mutate(data);
  };

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
                    placeholder="Add a comment..."
                    className="resize-none bg-transparent overflow-hidden min-h-0"
                    disabled={createComment.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="justify-end gap-2 mt-2 flex">
            <Button
              type="submit"
              size="sm"
              disabled={createComment.isPending || !form.formState.isDirty}
            >
              {createComment.isPending ? "Posting..." : "Comment"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};
