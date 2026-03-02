// components/trpc-progress.tsx

"use client";

import { useEffect } from "react";
import { trpc } from "@/trpc/client";
import NProgress from "nprogress";

export function TRPCProgress() {
  const utils = trpc.useUtils();

  useEffect(() => {
    // Track TRPC queries
    const handleQueryStart = () => {
      NProgress.start();
    };

    const handleQueryEnd = () => {
      NProgress.done();
    };

    // Note: This is a simplified version
    // You might need to track individual query states
    // based on your TRPC setup

    return () => {
      NProgress.done();
    };
  }, []);

  return null;
}
