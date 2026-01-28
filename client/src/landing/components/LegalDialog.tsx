import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LegalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export default function LegalDialog({
  open,
  onOpenChange,
  title,
  children,
}: LegalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(80vh-8rem)] pr-4">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {children}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
