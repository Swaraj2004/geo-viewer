import FileUploader from "@/components/FileUploader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FileLayersStateProps } from "@/lib/types";
import { AlignJustifyIcon } from "lucide-react";

const LayerControls = ({ fileLayers, setFileLayers }: FileLayersStateProps) => {
  const toggleFileVisibility = (id: string) => {
    setFileLayers((prev) =>
      prev.map((fl) => (fl.id === id ? { ...fl, visible: !fl.visible } : fl))
    );
  };

  return (
    <Sheet modal={false}>
      <SheetTrigger asChild>
        <Button
          className="absolute z-20 m-4 border bg-slate-50 hover:bg-slate-50/90 border-input"
          size="icon"
        >
          <AlignJustifyIcon className="w-6 h-6 text-black" size={28} />
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-auto bg-white/70 backdrop-blur-sm">
        <SheetHeader>
          <SheetTitle>Layers</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 mt-4">
          <FileUploader fileLayers={fileLayers} setFileLayers={setFileLayers} />
          <div>
            {fileLayers.map((fl) => (
              <div key={fl.id} className="flex items-center gap-2">
                <Checkbox
                  checked={fl.visible}
                  onCheckedChange={() => toggleFileVisibility(fl.id)}
                />
                <span
                  className="text-base font-semibold"
                  style={{ color: fl.color }}
                >
                  {fl.fileName}
                </span>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LayerControls;
