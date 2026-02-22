import { db } from "@/db";
import { videos } from "@/db/schema";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { HfInference } from "@huggingface/inference";
import sharp from "sharp";

interface InputType {
  userId: string;
  videoId: string;
  prompt: string;
}

export const { POST } = serve(async (context) => {
  const input = context.requestPayload as InputType;
  const { videoId, userId, prompt } = input;
  const utapi = new UTApi();

  const video = await context.run("get-video", async () => {
    const [existingVideo] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));

    if (!existingVideo) {
      throw new Error("Not found");
    }
    return existingVideo;
  });

  await context.run("cleanup-thumbnail", async () => {
    if (video.thumbnailKey) {
      await utapi.deleteFiles(video.thumbnailKey);
      await db
        .update(videos)
        .set({ thumbnailKey: null, thumbnailUrl: null })
        .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
    }
  });

  const uploadedThumbnail = await context.run(
    "generate-and-upload-thumbnail",
    async () => {
      const hf = new HfInference(process.env.HF_API_KEY);

      // Generate 1024x1024 image (free)
      const result = (await hf.textToImage({
        model: "black-forest-labs/FLUX.1-schnell",
        inputs: prompt,
      })) as Blob | string;

      // Convert to buffer
      let imageBuffer: ArrayBuffer;
      if (result instanceof Blob) {
        imageBuffer = await result.arrayBuffer();
      } else if (typeof result === "string") {
        const buffer = Buffer.from(result, "base64");
        imageBuffer = buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength,
        );
      } else {
        throw new Error("Unexpected response type");
      }

      // Crop to 16:9 aspect ratio (1024x576)
      const resizedBuffer = await sharp(Buffer.from(imageBuffer))
        .resize(1024, 576, {
          fit: "cover",
          position: "center",
        })
        .png()
        .toBuffer();

      // Convert Buffer to proper ArrayBuffer for TypeScript compliance
      const properArrayBuffer = resizedBuffer.buffer.slice(
        resizedBuffer.byteOffset,
        resizedBuffer.byteOffset + resizedBuffer.byteLength,
      ) as ArrayBuffer;

      // Create File from ArrayBuffer
      const file = new File([properArrayBuffer], "thumbnail.png", {
        type: "image/png",
      });

      const uploaded = await utapi.uploadFiles(file);

      if (!uploaded.data) {
        throw new Error("Failed to upload thumbnail");
      }

      return uploaded.data;
    },
  );

  await context.run("update-video", async () => {
    await db
      .update(videos)
      .set({
        thumbnailKey: uploadedThumbnail.key,
        thumbnailUrl: uploadedThumbnail.url,
      })
      .where(and(eq(videos.id, video.id), eq(videos.userId, video.userId)));
  });
});
