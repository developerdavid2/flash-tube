"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { videoUpdateSchema } from "@/db/schema";
import { trpc } from "@/trpc/client";
import {
  CopyCheckIcon,
  CopyIcon,
  Globe2Icon,
  ImagePlusIcon,
  LoaderIcon,
  LockIcon,
  MoreVerticalIcon,
  RotateCcwIcon,
  SparkleIcon,
  SparklesIcon,
  TrashIcon,
} from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { VideoPlayer } from "@/modules/videos/ui/components/video-player";
import { VideoDeleteModal } from "@/modules/videos/ui/components/video-delete-modal";
import Link from "next/link";
import { snakeCaseToTitle } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { THUMBNAIL_FALLBACK } from "@/constants";
import { ThumbnailUploadModal } from "../components/thumbnail-upload-modal";

type FormSchema = z.infer<typeof videoUpdateSchema>;

interface FormSectionProps {
  videoId: string;
}

export const FormSection = ({ videoId }: FormSectionProps) => {
  return (
    <Suspense fallback={<FormSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error Loaind Video ID page</p>}>
        <FormSectionSuspense videoId={videoId} />
      </ErrorBoundary>
    </Suspense>
  );
};

const FormSectionSkeleton = () => {
  return <p>Loading</p>;
};

const FormSectionSuspense = ({ videoId }: FormSectionProps) => {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [video] = trpc.studio.getOne.useSuspenseQuery({ id: videoId });
  const [categories] = trpc.categories.getMany.useSuspenseQuery();
  const [isCopied, setIsCopied] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [thumbnailModalOpen, setThumbnailModalOpen] = useState(false);

  const update = trpc.videos.update.useMutation({
    onSuccess: async () => {
      await utils.studio.getMany.invalidate();
      await utils.studio.getOne.invalidate({ id: videoId });
      toast.success("Video updated succesfully");
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const deleteVideo = trpc.videos.delete.useMutation({
    onSuccess: async () => {
      await utils.studio.getMany.invalidate();
      toast.success("Video deleted succesfully");
      router.push(`/studio`);
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const generateTitle = trpc.videos.generateTitle.useMutation({
    onSuccess: async () => {
      toast.success("Background job started", {
        description: "The title may take some time.",
      });
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const generateDescription = trpc.videos.generateDescription.useMutation({
    onSuccess: async () => {
      toast.success("Background job started", {
        description: "The  description may take some time.",
      });
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const generateThumbnail = trpc.videos.generateThumbnail.useMutation({
    onSuccess: async () => {
      toast.success("Background job started", {
        description: "This may take some time.",
      });
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const restoreThumbnail = trpc.videos.restoreThumbnail.useMutation({
    onSuccess: async () => {
      await utils.studio.getMany.invalidate();
      await utils.studio.getOne.invalidate({ id: videoId });
      toast.success("Thumbnail restored");
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const form = useForm<FormSchema>({
    resolver: zodResolver(videoUpdateSchema),
    defaultValues: video,
  });

  const onSubmit = async (data: FormSchema) => {
    await update.mutateAsync(data);
  };

  const onDelete = async () => {
    await deleteVideo.mutateAsync({ id: videoId });
    setDeleteModalOpen(false);
  };

  const isPending =
    update.isPending ||
    deleteVideo.isPending ||
    restoreThumbnail.isPending ||
    generateThumbnail.isPending ||
    generateTitle.isPending ||
    generateDescription.isPending;
  // TODO: Change if deploying outside of VERCEL

  const fullUrl = `${process.env.VERCEL_URL || "http://localhost:3000"}/videos/${videoId}`;

  const onCopy = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setIsCopied(true);
    toast.success("Video url copied");

    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <VideoDeleteModal
          open={deleteModalOpen}
          onOpenChangeAction={() => setDeleteModalOpen(false)}
          onDeleteAction={onDelete}
          videoTitle={video.title}
          disabled={isPending}
        />
        <ThumbnailUploadModal
          open={thumbnailModalOpen}
          onOpenChangeAction={() => setThumbnailModalOpen(false)}
          videoId={videoId}
        />
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Video details</h1>
            <p className="text-xs text-muted-foreground">
              Manage your video details
            </p>
          </div>
          <div className="flex items-center gap-x-2">
            <Button type="submit" disabled={isPending}>
              {update.isPending ? (
                <>
                  <LoaderIcon className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>Save</>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={isPending}>
                <Button variant="ghost" size="icon">
                  <MoreVerticalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setDeleteModalOpen(true)}
                  disabled={isPending}
                >
                  <TrashIcon className="size-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="space-y-8 lg:col-span-3">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <div className="flex items-center gap-2">
                      Title
                      <Button
                        size="icon"
                        variant="outline"
                        type="button"
                        className="rounded-full size-6 [&_svg]:size-3"
                        onClick={() => generateTitle.mutate({ id: videoId })}
                        disabled={isPending || !video.muxTrackId}
                      >
                        {generateTitle.isPending ? (
                          <LoaderIcon className="animate-spin" />
                        ) : (
                          <SparklesIcon />
                        )}
                      </Button>
                    </div>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Add a title to your video"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <div className="flex items-center gap-2">
                      Description
                      <Button
                        size="icon"
                        variant="outline"
                        type="button"
                        className="rounded-full size-6 [&_svg]:size-3"
                        onClick={() =>
                          generateDescription.mutate({ id: videoId })
                        }
                        disabled={isPending || !video.muxTrackId}
                      >
                        {generateDescription.isPending ? (
                          <LoaderIcon className="animate-spin" />
                        ) : (
                          <SparklesIcon />
                        )}
                      </Button>
                    </div>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      rows={10}
                      className="resize-none pr-10"
                      placeholder="Add a description to your video"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* TODO: Add thumbmnail field here */}
            {/* Thumbnail */}
            <FormField
              name="thumbnailUrl"
              control={form.control}
              render={() => (
                <FormItem>
                  <FormLabel>Thumbnail</FormLabel>
                  <FormControl>
                    <div className="p-0.5 border border-dashed border-neutral-400 relative h-[84px] w-[153px] group">
                      <Image
                        src={video.thumbnailUrl || THUMBNAIL_FALLBACK}
                        fill
                        alt="Thimnail"
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            className="bg-black/50 hover:bg-black/50 absolute top-1 right-1 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 duration-300 size-7"
                          >
                            <MoreVerticalIcon className="text-white" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" side="right">
                          <DropdownMenuItem
                            onClick={() => setThumbnailModalOpen(true)}
                          >
                            <ImagePlusIcon className="size-4 mr-1" />
                            Change
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              generateThumbnail.mutate({ id: videoId })
                            }
                          >
                            <SparkleIcon className="size-4 mr-1" />
                            AI-generated
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              restoreThumbnail.mutate({ id: videoId })
                            }
                          >
                            <RotateCcwIcon className="size-4 mr-1" />
                            Restore
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-col gap-y-8 lg:col-span-2">
            <div className="flex flex-col gap-4 bg-[#f9f9f9] rounded-xl aoverflow-hidden h-fit">
              <div className="aspect-video overflow-hidden relative">
                <VideoPlayer
                  playbackId={video.muxPlaybackId}
                  thumbnailUrl={video.thumbnailUrl}
                />
              </div>
              <div className="p-4 flex flex-col gap-y-6">
                <div className="flex justify-between items-center gap-x-2">
                  <div className="flex flex-col gap-y-1">
                    <p className="text-muted-foreground text-xs">Video link</p>
                    <div className="flex items-center gap-x-2">
                      <Link href={`/videos/${videoId}`}>
                        <p className="line-clamp-1 text-sm text-blue-500">
                          {fullUrl}
                        </p>
                      </Link>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={onCopy}
                        disabled={isCopied || isPending}
                      >
                        {isCopied ? <CopyCheckIcon /> : <CopyIcon />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-y-1">
                    <p className="text-muted-foreground text-xs">
                      Video status
                    </p>
                    <p className="text-sm">
                      {snakeCaseToTitle(video.muxStatus || "preparing")}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-y-1">
                    <p className="text-muted-foreground text-xs">
                      Subtitles status
                    </p>
                    <p className="text-sm">
                      {snakeCaseToTitle(video.muxTrackStatus || "no_subtitles")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category */}

            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center">
                          <Globe2Icon className="size-4 mr-2" />
                          Public
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center">
                          <LockIcon className="size-4 mr-2" />
                          Private
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </form>
    </Form>
  );
};
