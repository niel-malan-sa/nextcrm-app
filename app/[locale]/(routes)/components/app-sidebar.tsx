"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import getDashboardMenuItem from "./menu-items/Dashboard";
import getCrmMenuItem from "./menu-items/Crm";
import getProjectsMenuItem from "./menu-items/Projects";
import getEmailsMenuItem from "./menu-items/Emails";
import getReportsMenuItem from "./menu-items/Reports";
import getDocumentsMenuItem from "./menu-items/Documents";
import getInvoicesMenuItem from "./menu-items/Invoices";
import getAdministrationMenuItem from "./menu-items/Administration";
import getCampaignsMenuItem from "./menu-items/Campaigns";
import getSchedulingMenuItem from "./menu-items/Scheduling";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
  userStatus?: string;
  userLanguage?: string;
  lastLoginAt?: Date;
}

interface Session {
  user: User;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  dict: any;
  session: Session;
}

export function AppSidebar({
  dict,
  session,
  ...props
}: AppSidebarProps) {
  const { state } = useSidebar();
  const isExpanded = state === "expanded";

  const navItems = [
    getDashboardMenuItem({ title: dict?.dashboard || "Dashboard" }),
    getCrmMenuItem({ localizations: dict.crm }),
    getCampaignsMenuItem({
      localizations: {
        title: "Campaigns",
        campaigns: "All Campaigns",
        templates: "Templates",
        targets: "Targets",
        targetLists: "Target Lists",
      },
    }),
    getProjectsMenuItem({ title: dict?.projects || "Projects" }),
    getEmailsMenuItem({ title: dict?.emails || "Emails" }),
    getReportsMenuItem({ title: dict?.reports || "Reports" }),
    getDocumentsMenuItem({ title: dict?.documents || "Documents" }),
    getInvoicesMenuItem({ title: dict?.invoices || "Invoices" }),
    getSchedulingMenuItem(),
  ];

  if (session?.user?.role === "admin") {
    navItems.push(
      getAdministrationMenuItem({ title: dict?.settings || "Administration" }),
    );
  }

  const userData = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    avatar: session.user.image,
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div
          className={cn(
            "flex items-center py-1",
            isExpanded ? "gap-x-3" : "justify-center",
          )}
        >
          {/* AffluentOS square logo mark */}
          <div
            className={cn(
              "flex-shrink-0 transition-transform duration-500",
              isExpanded && "rotate-[360deg]",
            )}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 30 30"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                width="30"
                height="30"
                rx="5"
                fill="hsl(var(--primary))"
              />
            </svg>
          </div>

          {/* App Name */}
          <h1
            className={cn(
              "origin-left font-bold text-xl tracking-tight transition-all overflow-hidden whitespace-nowrap",
              !isExpanded ? "w-0 opacity-0" : "w-auto opacity-100",
            )}
          >
            AffluentOS
          </h1>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navItems} dict={dict} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
