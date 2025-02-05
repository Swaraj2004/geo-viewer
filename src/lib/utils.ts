import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to Darken a Color
export function darken(color: string, amount: number = 0.2): string {
  // Assumes color is in the form "#RRGGBB"
  const num = parseInt(color.slice(1), 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.floor(r * (1 - amount));
  g = Math.floor(g * (1 - amount));
  b = Math.floor(b * (1 - amount));
  const newColor = (r << 16) | (g << 8) | b;
  return `#${newColor.toString(16).padStart(6, "0")}`;
}
