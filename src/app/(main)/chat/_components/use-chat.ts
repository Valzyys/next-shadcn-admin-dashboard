import { create } from "zustand";

type Config = {
  selected: string | null; // member.id yang dipilih
  selectedGeneration: string | null; // null = semua generasi
};

type ChatStore = {
  chat: Config;
  setChat: (chat: Partial<Config>) => void;
};

const useChatStore = create<ChatStore>((set) => ({
  chat: {
    selected: null,
    selectedGeneration: null,
  },
  setChat: (chat) => set((state) => ({ chat: { ...state.chat, ...chat } })),
}));

export function useChat() {
  const chat = useChatStore((state) => state.chat);
  const setChat = useChatStore((state) => state.setChat);
  return [chat, setChat] as const;
}
