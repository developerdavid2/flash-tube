"use client";

import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

interface ThumbnailUploadModalProps {
  videoId: string;
  open: boolean;
  onOpenChangeAction: (open?: boolean) => void;
}

const formSchema = z.object({
  prompt: z.string().min(10, "Prompt is required"),
});
type FormSchema = z.infer<typeof formSchema>;

export const ThumbnailGenerateModal = ({
  videoId,
  open,
  onOpenChangeAction,
}: ThumbnailUploadModalProps) => {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const generateThumbnail = trpc.videos.generateThumbnail.useMutation({
    onSuccess: async () => {
      toast.success("Background job started", {
        description: "This may take some time.",
      });
      form.reset();
      onOpenChangeAction(false); // Close modal on success
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission
    e.stopPropagation(); // CRITICAL: Stop event from bubbling to parent form

    // Manually handle the form submission
    form.handleSubmit((values) => {
      generateThumbnail.mutate({
        prompt: values.prompt,
        id: videoId,
      });
    })(e);
  };

  return (
    <ResponsiveModal
      title="Generate a thumbnail"
      open={open}
      onOpenChange={onOpenChangeAction}
    >
      <Form {...form}>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prompt</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className="resize-none"
                    cols={30}
                    rows={5}
                    placeholder="A description of wanted thumbnail"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={generateThumbnail.isPending}>
              Generate
            </Button>
          </div>
        </form>
      </Form>
    </ResponsiveModal>
  );
};
