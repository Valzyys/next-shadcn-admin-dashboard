export type PmjAttachment = {
  file_path: string;
  file_type: string; // e.g. "image/jpeg", "audio/mpeg"
  file_name: string | null;
  width: number | null;
  height: number | null;
};

export type PmjMessage = {
  id: string;
  type: string;
  body: string;
  created_at: string;
  updated_at: string;
  attachments: PmjAttachment[];
  poll: unknown | null;
};

export type PmjMessagesResponse = {
  status: boolean;
  author: string;
  idol_name: string;
  identifier: string;
  conversation_id: string;
  page: number;
  fetched_at: string;
  data: {
    success: boolean;
    conversation_id: string;
    page: number;
    pageSize: number;
    count: number;
    has_more: boolean;
    messages: PmjMessage[];
  };
};

const PMJ_API_BASE = "https://v5.jkt48connect.com/api/pmj/messages";

/** API menyisipkan karakter zero-width (watermark tersembunyi) di body pesan — ini membersihkannya. */
export function stripZeroWidth(text: string): string {
  return text.replace(/[\u200B-\u200F\uFEFF]/g, "");
}

export function getAttachmentKind(fileType: string): "image" | "audio" | "other" {
  if (fileType.startsWith("image/")) return "image";
  if (fileType.startsWith("audio/")) return "audio";
  return "other";
}

export async function fetchIdolMessages(identifier: string, page = 1): Promise<PmjMessagesResponse> {
  const res = await fetch(`${PMJ_API_BASE}/${encodeURIComponent(identifier)}?page=${page}`);

  if (!res.ok) {
    throw new Error(`Gagal memuat pesan untuk ${identifier} (${res.status})`);
  }

  const json = (await res.json()) as PmjMessagesResponse;

  if (!json.status || !json.data?.success) {
    throw new Error(`Respons API tidak valid untuk ${identifier}`);
  }

  return json;
}
