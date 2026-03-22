import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  title?: string;
  message: string;
  className?: string;
}

export function ErrorMessage({ title = "Error", message, className }: ErrorMessageProps) {
  return (
    <div className={cn("relative w-full rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-red-500 [&>svg]:absolute [&>svg]:text-red-500 [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:translate-y-[-3px]", className)}>
      <AlertCircle className="h-4 w-4" />
      <div className="pl-7">
        <h5 className="mb-1 font-medium leading-none tracking-tight">{title}</h5>
        <div className="text-sm opacity-90">{message}</div>
      </div>
    </div>
  );
}