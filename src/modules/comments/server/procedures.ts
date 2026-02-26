import { db } from "@/db";
import {
  commentInsertSchema,
  commentReactions,
  comments,
  users,
} from "@/db/schema";
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  inArray,
  isNotNull,
  isNull,
  lt,
  or,
} from "drizzle-orm";
import { z } from "zod";

export const commentsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      commentInsertSchema
        .pick({
          videoId: true,
          parentId: true,
          value: true,
        })
        .extend({
          videoId: z.uuid("Invalid video ID"),
          parentId: z.uuid().nullish(),
        }),
    )
    .mutation(async ({ ctx, input }) => {
      const { videoId, parentId, value } = input;
      const { id: userId } = ctx.user;

      const [existingComment] = await db
        .select()
        .from(comments)
        .where(inArray(comments.id, parentId ? [parentId] : []));

      if (!existingComment && parentId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (existingComment?.parentId && parentId) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const [createdComment] = await db
        .insert(comments)
        .values({ userId, videoId, parentId, value })
        .returning();

      return createdComment;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.uuid(),
        value: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, value } = input;
      const { id: userId } = ctx.user;

      const [existingComment] = await db
        .select()
        .from(comments)
        .where(eq(comments.id, id));

      if (!existingComment) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (existingComment.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (existingComment.isDeleted) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot edit deleted comment",
        });
      }

      const [updatedComment] = await db
        .update(comments)
        .set({
          value,
          isEdited: true,
          editedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(comments.id, id))
        .returning();

      return updatedComment;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      const { id: userId } = ctx.user;

      const [comment] = await db
        .select({
          ...getTableColumns(comments),
          replyCount: db.$count(comments, eq(comments.parentId, id)),
        })
        .from(comments)
        .where(eq(comments.id, id));

      if (!comment) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (comment.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const isReply = comment.parentId !== null;
      const hasReplies = comment.replyCount > 0;

      // Replies are always hard deleted
      if (isReply) {
        const [hardDeleted] = await db
          .delete(comments)
          .where(eq(comments.id, id))
          .returning();

        return { type: "hard", comment: hardDeleted };
      }

      // Parent comments: soft delete if has replies, hard delete if not
      if (hasReplies) {
        const [softDeleted] = await db
          .update(comments)
          .set({
            isDeleted: true,
            deletedAt: new Date(),
            value: "[deleted]",
          })
          .where(eq(comments.id, id))
          .returning();

        return { type: "soft", comment: softDeleted };
      } else {
        const [hardDeleted] = await db
          .delete(comments)
          .where(eq(comments.id, id))
          .returning();

        return { type: "hard", comment: hardDeleted };
      }
    }),

  getMany: baseProcedure
    .input(
      z.object({
        videoId: z.uuid("Invalid video ID"),
        parentId: z.uuid().nullish(),
        cursor: z
          .object({
            id: z.uuid(),
            updatedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { clerkUserId } = ctx;
      const { videoId, cursor, limit, parentId } = input;

      let userId;
      const [user] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []));

      if (user) {
        userId = user.id;
      }

      const viewerCommentReactions = db.$with("viewer_comment_reactions").as(
        db
          .select({
            commentId: commentReactions.commentId,
            type: commentReactions.type,
          })
          .from(commentReactions)
          .where(inArray(commentReactions.userId, userId ? [userId] : [])),
      );

      //  UPDATED: Only count non-deleted replies
      const replies = db.$with("replies").as(
        db
          .select({
            parentId: comments.parentId,
            count: count(comments.id).as("count"),
          })
          .from(comments)
          .where(
            and(isNotNull(comments.parentId), eq(comments.isDeleted, false)),
          )
          .groupBy(comments.parentId),
      );

      const [totalData, data] = await Promise.all([
        db
          .select({ count: count() })
          .from(comments)
          .where(
            and(eq(comments.videoId, videoId), eq(comments.isDeleted, false)),
          ),

        db
          .with(viewerCommentReactions, replies)
          .select({
            ...getTableColumns(comments),
            user: users,
            viewerCommentReaction: viewerCommentReactions.type,
            replyCount: replies.count,
            likeCount: db.$count(
              commentReactions,
              and(
                eq(commentReactions.commentId, comments.id),
                eq(commentReactions.type, "like"),
              ),
            ),
            dislikeCount: db.$count(
              commentReactions,
              and(
                eq(commentReactions.commentId, comments.id),
                eq(commentReactions.type, "dislike"),
              ),
            ),
          })
          .from(comments)
          .where(
            and(
              eq(comments.videoId, videoId),
              parentId
                ? eq(comments.parentId, parentId)
                : isNull(comments.parentId),
              cursor
                ? or(
                    lt(comments.updatedAt, cursor.updatedAt),
                    and(
                      eq(comments.updatedAt, cursor.updatedAt),
                      lt(comments.id, cursor.id),
                    ),
                  )
                : undefined,
            ),
          )
          .innerJoin(users, eq(comments.userId, users.id))
          .leftJoin(
            viewerCommentReactions,
            eq(comments.id, viewerCommentReactions.commentId),
          )
          .leftJoin(replies, eq(comments.id, replies.parentId))
          .orderBy(desc(comments.updatedAt), desc(comments.id))
          .limit(limit + 1),
      ]);

      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];

      const nextCursor = hasMore
        ? {
            id: lastItem.id,
            updatedAt: lastItem.updatedAt,
          }
        : null;

      return {
        totalCount: totalData[0].count,
        items,
        nextCursor,
      };
    }),
});
