import { db } from "@/db";
import { videos } from "@/db/schema";
import { mux } from "@/lib/mux";
import {
  VideoAssetCreatedWebhookEvent,
  VideoAssetErroredWebhookEvent,
  VideoAssetReadyWebhookEvent,
  VideoAssetTrackReadyWebhookEvent,
  VideoAssetDeletedWebhookEvent,
} from "@mux/mux-node/resources/webhooks";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
const SIGNING_SECRET = process.env.MUX_WEBHOOK_SECRET!;

type WebhookEvent =
  | VideoAssetCreatedWebhookEvent
  | VideoAssetReadyWebhookEvent
  | VideoAssetErroredWebhookEvent
  | VideoAssetDeletedWebhookEvent
  | VideoAssetTrackReadyWebhookEvent;

export const POST = async (req: NextRequest) => {
  if (!SIGNING_SECRET) {
    throw new Error("MUX_WEBHOOK_SECRET is not set");
  }

  const headersPayload = await headers();
  const muxSignature = headersPayload.get("mux-signature");

  if (!muxSignature) {
    return new NextResponse("No signature found", { status: 401 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  mux.webhooks.verifySignature(
    body,
    {
      "mux-signature": muxSignature,
    },
    SIGNING_SECRET,
  );

  switch (payload.type as WebhookEvent["type"]) {
    case "video.asset.created": {
      const data = payload.data as VideoAssetCreatedWebhookEvent["data"];

      if (!data.upload_id) {
        return new NextResponse("No upload ID found", { status: 400 });
      }

      await db
        .update(videos)
        .set({
          muxAssetId: data.id,
          muxStatus: data.status,
        })
        .where(eq(videos.muxUploadId, data.upload_id));
      break;
    }
    case "video.asset.ready": {
      const data = payload.data as VideoAssetReadyWebhookEvent["data"];
      const playbackId = data.playback_ids?.[0].id;

      if (!data.upload_id) {
        return new NextResponse("No upload ID found", { status: 400 });
      }

      if (!playbackId) {
        return new NextResponse("No playback ID found", { status: 400 });
      }

      const tempThumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.webp?width=1000&height=562&fit_mode=crop`;
      const tempPreviewUrl = `https://image.mux.com/${playbackId}/animated.gif`;
      const duration = data.duration ? Math.round(data.duration * 1000) : 0;

      const utapi = new UTApi();

      // If Mux retries this webhook (or a user already changed the thumbnail),
      // delete the previously stored UploadThing files first so we only keep one
      // thumbnail + one preview per video.
      const [existing] = await db
        .select({
          thumbnailKey: videos.thumbnailKey,
          previewKey: videos.previewKey,
        })
        .from(videos)
        .where(eq(videos.muxUploadId, data.upload_id));

      const [uploadedThumbnail, uploadedPreview] =
        await utapi.uploadFilesFromUrl([tempThumbnailUrl, tempPreviewUrl]);
      if (!uploadedThumbnail.data || !uploadedPreview.data) {
        return new Response("Failed to upload thumbnail or preview", {
          status: 500,
        });
      }

      const { key: thumbnailKey, url: thumbnailUrl } = uploadedThumbnail.data;
      const { key: previewKey, url: previewUrl } = uploadedPreview.data;

      await db
        .update(videos)
        .set({
          muxStatus: data.status,
          muxPlaybackId: playbackId,
          muxAssetId: data.id,
          thumbnailUrl,
          thumbnailKey,
          previewUrl,
          previewKey,
          duration,
        })
        .where(eq(videos.muxUploadId, data.upload_id));

      const keysToDelete = [
        existing?.thumbnailKey,
        existing?.previewKey,
      ].filter((k): k is string =>
        Boolean(k && k !== thumbnailKey && k !== previewKey),
      );
      if (keysToDelete.length > 0) {
        try {
          await utapi.deleteFiles(keysToDelete);
        } catch {
          // Best-effort cleanup; DB already points at the latest keys.
        }
      }
      break;
    }
    case "video.asset.errored": {
      const data = payload.data as VideoAssetErroredWebhookEvent["data"];

      if (!data.upload_id) {
        return new NextResponse("No upload ID found", { status: 400 });
      }
      await db
        .update(videos)
        .set({
          muxStatus: data.status,
        })
        .where(eq(videos.muxUploadId, data.upload_id));
      break;
    }
    case "video.asset.deleted": {
      const data = payload.data as VideoAssetDeletedWebhookEvent["data"];
      if (!data.upload_id) {
        return new NextResponse("No upload ID found", { status: 400 });
      }
      const [existing] = await db
        .select({
          thumbnailKey: videos.thumbnailKey,
          previewKey: videos.previewKey,
        })
        .from(videos)
        .where(eq(videos.muxUploadId, data.upload_id));

      const keysToDelete = [
        existing?.thumbnailKey,
        existing?.previewKey,
      ].filter((k): k is string => Boolean(k));
      if (keysToDelete.length > 0) {
        try {
          const utapi = new UTApi();
          await utapi.deleteFiles(keysToDelete);
        } catch {
          // Ignore cleanup errors; we still want to delete the DB record.
        }
      }

      await db.delete(videos).where(eq(videos.muxUploadId, data.upload_id));
      break;
    }
    case "video.asset.track.ready": {
      const data = payload.data as VideoAssetTrackReadyWebhookEvent["data"] & {
        asset_id: string;
      };

      // Typescript incorrectly says that asset_id does not exist
      const assetId = data.asset_id;
      const trackId = data.id;
      const status = data.status;

      if (!assetId) {
        return new NextResponse("Missing upload ID", { status: 400 });
      }
      await db
        .update(videos)
        .set({
          muxTrackId: trackId,
          muxTrackStatus: status,
        })
        .where(eq(videos.muxAssetId, assetId));
    }
  }

  return new NextResponse("Webhook received", { status: 200 });
};
