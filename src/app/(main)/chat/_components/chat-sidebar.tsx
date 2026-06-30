"use client";

import { EllipsisVertical, LogOut, Settings, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { getInitials } from "@/lib/utils";

import { currentUser, generationItems } from "./data";

interface ChatSidebarProps {
  selectedGenerationId?: string;
  onSelectGeneration?: (generationId: string) => void;
}

export function ChatSidebar({ selectedGenerationId, onSelectGeneration }: ChatSidebarProps) {
  const { state } = useSidebar();
  const _isCollapsed = state === "collapsed";

  return (
    <Sidebar
      collapsible="offcanvas"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]! **:data-[sidebar=sidebar]:bg-background"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-normal">Generations</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {generationItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  className="[&_svg]:size-3.5"
                  size="sm"
                  isActive={selectedGenerationId ? selectedGenerationId === item.id : item.isActive}
                  tooltip={item.title}
                  onClick={() => onSelectGeneration?.(item.id)}
                >
                  <item.icon />
                  <span className="font-medium">{item.title}</span>
                </SidebarMenuButton>
                <SidebarMenuBadge className="font-medium">{item.label}</SidebarMenuBadge>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Separator />
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar>
                    <AvatarFallback className="text-xs">{getInitials(currentUser.name)}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{currentUser.name}</span>
                    <span className="truncate text-muted-foreground text-xs">{currentUser.email}</span>
                  </div>
                  <EllipsisVertical className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56" side="top">
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar>
                      <AvatarFallback className="text-xs">{getInitials(currentUser.name)}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{currentUser.name}</span>
                      <span className="truncate text-muted-foreground text-xs">{currentUser.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <UserRound />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

/**
 * Optional helper component: renders the member avatar grid for a given generation.
 * Use alongside ChatSidebar when `onSelectGeneration` is wired up, e.g.:
 *
 *   const [genId, setGenId] = useState(generationItems[0].id);
 *   <ChatSidebar selectedGenerationId={genId} onSelectGeneration={setGenId} />
 *   <GenerationMemberList generationId={genId} />
 */
export function GenerationMemberList({ generationId }: { generationId: string }) {
  const group = generationItems.find((g) => g.id === generationId);

  if (!group) return null;

  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4">
      {group.members.map((member) => (
        <a
          key={member.id}
          href={member.socials[0]?.url ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors hover:bg-muted"
        >
          <Avatar className="size-16">
            <AvatarImage src={member.img} alt={member.name} />
            <AvatarFallback>{getInitials(member.nickname)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm">{member.nickname}</div>
            <div className="text-muted-foreground text-xs capitalize">{member.team || "—"}</div>
          </div>
        </a>
      ))}
    </div>
  );
}
