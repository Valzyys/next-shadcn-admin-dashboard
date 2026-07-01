"use client";

import { PanelRightClose, PanelRightOpen } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import { cn, getInitials } from "@/lib/utils";

import type { Member } from "./data";
import { useChat } from "./use-chat";

interface ChatConversationListProps {
  members: Member[];
  onSelectMember?: (member: Member) => void;
  className?: string;
}

export function ChatConversationList({ members, onSelectMember, className }: ChatConversationListProps) {
  const [chat, setChat] = useChat();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  const sortedMembers = [...members].sort((a, b) => a.nickname.localeCompare(b.nickname));

  return (
    <div className={cn("flex h-full flex-col gap-3 py-3", className)}>
      <div className="flex items-center justify-between gap-4 px-2 py-0.5">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleSidebar}
            className="[&_svg]:transition-transform [&_svg]:duration-300"
          >
            {isCollapsed ? <PanelRightClose /> : <PanelRightOpen />}
          </Button>
          <Separator orientation="vertical" className="mr-1.5 h-4 data-vertical:self-center" />
          <h1 className="font-medium text-xl leading-none">PM</h1>
        </div>
        <span className="text-muted-foreground text-xs">{sortedMembers.length} member</span>
      </div>

      <Separator />

      <div className="flex min-h-0 flex-1 flex-col">
        <ScrollArea
          type="hover"
          className="h-full min-h-0 flex-1 overflow-hidden [&_[data-orientation=vertical][data-slot=scroll-area-scrollbar]]:w-1.5"
        >
          <div className="flex flex-col gap-1 px-2 py-1">
            {sortedMembers.map((member) => {
              const isSelected = chat.selected === member.id;

              return (
                <button
                  key={member.id}
                  type="button"
                  className={cn(
                    "w-full overflow-hidden rounded-lg px-2.5 py-2.5 text-left ring-inset transition-colors",
                    isSelected ? "bg-muted ring-1 ring-border" : "hover:bg-muted/75",
                  )}
                  onClick={(event) => {
                    event.currentTarget.blur();
                    setChat({ selected: member.id });
                    onSelectMember?.(member);
                  }}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar className="shrink-0">
                      <AvatarImage src={member.img} alt={member.name} />
                      <AvatarFallback
                        className={cn(
                          "text-foreground text-xs transition-colors duration-400",
                          isSelected && "bg-background/50",
                        )}
                      >
                        {getInitials(member.nickname)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="w-0 flex-1 overflow-hidden">
                      <div className="truncate font-medium text-sm leading-5">{member.nickname}</div>
                      <div className="truncate text-muted-foreground text-xs capitalize leading-4">
                        {member.generationLabel}
                        {member.team ? ` · ${member.team}` : ""}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {sortedMembers.length === 0 && (
              <div className="px-3 py-8 text-center text-muted-foreground text-sm">
                Tidak ada member di generasi ini.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
