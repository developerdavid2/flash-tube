import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type CommentGetManyOutput = RouterOutputs["comments"]["getMany"];
export type Comment = CommentGetManyOutput["items"][number];
