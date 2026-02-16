"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LogOutIcon, VideoIcon } from "lucide-react";
import Link from "next/link";
import { StudioSidebarHeader } from "./studio-sidebar-header";
import { usePathname } from "next/navigation";

export const StudioSidebar = () => {
  const pathname = usePathname();
  return (
    <Sidebar className="pt-16 z-40" collapsible="icon">
      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <StudioSidebarHeader />
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/studio"}
                  tooltip="Content"
                  asChild
                >
                  <Link href="/studio">
                    <VideoIcon className="siz-5" />
                    <span className="text-sm">Content</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Exit studio" asChild>
                  <Link href="/">
                    <LogOutIcon className="siz-5" />
                    <span className="text-sm">Exit studio</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
