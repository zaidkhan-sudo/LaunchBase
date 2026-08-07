import { Boxes } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Logo({ className }) {
  return (
    <Link to="/" className={cn("flex items-center gap-3", className)} aria-label="LaunchBase home">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
        <Boxes className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="text-lg font-semibold tracking-normal">LaunchBase</span>
    </Link>
  );
}
