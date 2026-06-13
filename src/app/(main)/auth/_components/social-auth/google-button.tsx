import { siGoogle } from "simple-icons";
import { SimpleIcon } from "@/components/simple-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GoogleButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  const handleClick = () => {
    window.dispatchEvent(new Event("trigger-google-login"));
  };

  return (
    <Button
      variant="secondary"
      className={cn(className)}
      type="button"
      onClick={handleClick}
      {...props}
    >
      <SimpleIcon icon={siGoogle} className="size-4" />
      Continue with Google
    </Button>
  );
}
