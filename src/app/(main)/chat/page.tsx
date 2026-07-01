import { Chat } from "./_components/chat";
import { members } from "./_components/data";

export default function Page() {
  return <Chat members={members} />;
}
