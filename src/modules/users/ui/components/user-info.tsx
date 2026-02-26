import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { TooltipContent } from "@/components/ui/tooltip";
import { cva, VariantProps } from "class-variance-authority";
import React from "react";

const userInfoVariants = cva("flex items-center gap-1", {
  variants: {
    size: {
      default: "[&_p]:text-sm [&_svg]:size-4",
      lg: "[&_p]:text-base [&_svg]:size-5 [&_p]:font-medium [&_p]:text-black",
      sm: "[&_p]:text-xs [&_svg]:size-3.5",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

interface UserInfoProps extends VariantProps<typeof userInfoVariants> {
  name: string;
  className?: string;
}
export const UserInfo = ({ name, className, size }: UserInfoProps) => {
  return (
    <div className={cn(userInfoVariants({ size, className }))}>
      <Tooltip>
        <TooltipTrigger asChild>
          <p className={cn("line-clamp-1 !text-foreground", className)}>
            {name}
          </p>
        </TooltipTrigger>
        <TooltipContent align="center">
          <p>{name}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
