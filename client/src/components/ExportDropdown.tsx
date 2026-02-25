import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";

export type ExportFormat = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
};

export default function ExportDropdown({ formats }: { formats: ExportFormat[] }) {
  if (formats.length === 0) return null;

  if (formats.length === 1) {
    return (
      <Button variant="outline" size="sm" onClick={formats[0].onClick}>
        <Download className="h-4 w-4 mr-2" />
        Esporta
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Esporta
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {formats.map((format) => (
          <DropdownMenuItem key={format.label} onClick={format.onClick}>
            {format.icon && <span className="mr-2">{format.icon}</span>}
            {format.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
