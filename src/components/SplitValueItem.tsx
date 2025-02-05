import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { availableColors } from "@/lib/constants";
import { PaintBucketIcon } from "lucide-react";

interface SplitValueItemProps {
  fileId: string;
  value: string;
  checked: boolean;
  toggleVisibility: (fileId: string, value: string) => void;
  updateColor: (fileId: string, value: string, color: string) => void;
}

const SplitValueItem: React.FC<SplitValueItemProps> = ({
  fileId,
  value,
  checked,
  toggleVisibility,
  updateColor,
}) => (
  <div className="flex items-center justify-between mx-1">
    <div className="flex items-center gap-2">
      <Checkbox
        id={value}
        checked={checked}
        onCheckedChange={() => toggleVisibility(fileId, value)}
      />
      <label htmlFor={value}>{value}</label>
    </div>
    <Popover>
      <PopoverTrigger>
        <PaintBucketIcon className="w-4 h-4 text-primary" />
      </PopoverTrigger>
      <PopoverContent className="grid w-fit grid-cols-4 gap-1 p-2.5">
        {availableColors.map((color) => (
          <div
            key={color}
            className="w-6 h-6 transition-transform border rounded-sm cursor-pointer hover:scale-110"
            style={{ backgroundColor: color }}
            onClick={() => updateColor(fileId, value, color)}
          />
        ))}
      </PopoverContent>
    </Popover>
  </div>
);
export default SplitValueItem;
