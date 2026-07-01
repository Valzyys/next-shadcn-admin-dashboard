"use client";

import { useEffect, useState } from "react";
import {
  AlarmClock,
  ArrowLeft,
  Copy,
  Flag,
  Loader2,
  MoreHorizontal,
  PhoneCall,
  RefreshCw,
  Tag,
  UserRound,
} from "lucide-react";

import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, getInitials } from "@/lib/utils";
import { fetchIdolMessages, getAttachmentKind, type PmjMessage, proxyMediaUrl, stripZeroWidth } from "@/lib/pmj-api";

import type { Contact } from "./data";

interface ChatThreadProps {
  contact: Contact;
  identifier: string;
  onOpenContact?: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
  className?: string;
}

function formatDateLabel(iso: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

function formatTimeLabel(iso: string) {
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function ChatThread({ contact, identifier, onOpenContact, onBack, showBackButton, className }: ChatThreadProps) {
  const [messages, setMessages] = useState<PmjMessage[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    setPage(1);
    setHasMore(false);
    setIsLoading(true);
    setError(null);

    fetchIdolMessages(identifier, 1)
      .then((res) => {
        if (cancelled) return;
        setMessages(res.data.messages);
        setHasMore(res.data.has_more);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Gagal memuat pesan");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [identifier, retryKey]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setIsLoadingMore(true);
    try {
      const res = await fetchIdolMessages(identifier, nextPage);
      setMessages((prev) => [...prev, ...res.data.messages]);
      setHasMore(res.data.has_more);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat pesan lama");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Kelompokkan per tanggal, urutan asli dari API dipertahankan (terbaru di atas).
  const groups = messages.reduce<Array<{ label: string; items: PmjMessage[] }>>((acc, message) => {
    const label = formatDateLabel(message.created_at);
    const lastGroup = acc[acc.length - 1];
    if (lastGroup && lastGroup.label === label) {
      lastGroup.items.push(message);
    } else {
      acc.push({ label, items: [message] });
    }
    return acc;
  }, []);

  return (
    <div className={cn("flex h-full flex-col py-3", className)}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="md:hidden"
                aria-label="Back to conversations"
                onClick={onBack}
              >
                <ArrowLeft />
              </Button>
            )}
            <Avatar className="size-8">
              <AvatarImage src={contact.avatarUrl} alt={contact.name} />
              <AvatarFallback className="bg-background text-foreground">{getInitials(contact.name)}</AvatarFallback>
              <AvatarBadge className="bg-green-600 dark:bg-green-800" />
            </Avatar>
            <div>
              <div className="font-medium text-sm">{contact.name}</div>
              <div className="text-muted-foreground text-xs leading-3">{contact.role}</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Call">
                  <PhoneCall />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Call</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Tag">
                  <Tag />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Tag</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Snooze">
                  <AlarmClock />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Snooze</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="More actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={onOpenContact}>
                    <UserRound />
                    View profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy />
                    Copy email
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Flag />
                    Mark priority
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Separator />
      </div>

      <ScrollArea
        type="hover"
        className="min-h-0 flex-1 [&_[data-orientation=vertical][data-slot=scroll-area-scrollbar]]:w-1.5"
      >
        <div className="flex flex-col gap-6 px-2 py-8">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
              <Loader2 className="size-4 animate-spin" />
              Memuat pesan...
            </div>
          )}

          {!isLoading && error && (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground text-sm">
              <span>Gagal memuat pesan: {error}</span>
              <Button variant="outline" size="sm" onClick={() => setRetryKey((k) => k + 1)}>
                <RefreshCw className="size-3.5" />
                Coba lagi
              </Button>
            </div>
          )}

          {!isLoading && !error && messages.length === 0 && (
            <div className="py-16 text-center text-muted-foreground text-sm">
              Belum ada pesan dari {contact.name}.
            </div>
          )}

          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground text-xs">{group.label}</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {group.items.map((message) => {
                const text = stripZeroWidth(message.body);

                return (
                  <div key={message.id} className="flex items-end gap-2">
                    <Avatar className="shrink-0">
                      <AvatarImage src={contact.avatarUrl} alt={contact.name} />
                      <AvatarFallback className="bg-muted text-foreground text-xs">
                        {getInitials(contact.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex max-w-md flex-col gap-2 rounded-xl bg-muted px-4 py-3 text-sm">
                      {text && <p className="whitespace-pre-wrap leading-relaxed">{text}</p>}

                     {message.attachments.map((attachment, idx) => {
  const kind = getAttachmentKind(attachment.file_type);
  const proxiedUrl = proxyMediaUrl(attachment.file_path);

  if (kind === "image") {
    return (
      <a key={idx} href={proxiedUrl} target="_blank" rel="noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={proxiedUrl}
          alt=""
          loading="lazy"
          className="max-w-xs rounded-lg border object-cover"
        />
      </a>
    );
  }

  if (kind === "audio") {
    return (
      <audio key={idx} controls className="w-64 max-w-full">
        <source src={proxiedUrl} type={attachment.file_type} />
      </audio>
    );
  }

  return (
    <a key={idx} href={proxiedUrl} target="_blank" rel="noreferrer" className="text-primary text-xs underline">
      Lihat lampiran
    </a>
  );
})}

                      <div className="text-muted-foreground/75 text-xs">{formatTimeLabel(message.created_at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {hasMore && !isLoading && (
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={isLoadingMore}>
                {isLoadingMore && <Loader2 className="size-3.5 animate-spin" />}
                Muat pesan lama
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="px-2">
        <div className="flex items-center justify-center gap-2 rounded-md border bg-muted/40 px-3 py-3 text-muted-foreground text-xs">
          <UserRound className="size-3.5" />
          Pesan satu arah dari {contact.name} — Anda tidak dapat membalas
        </div>
      </div>
    </div>
  );
}
