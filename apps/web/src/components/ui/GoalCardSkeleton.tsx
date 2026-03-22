import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

export function GoalCardSkeleton() {
  return (
    <Card className="flex flex-col h-full border-zinc-800">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-2 w-full">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-4 pt-2">
        <Skeleton className="h-6 w-20 mb-4 rounded-full" />
        
        <div className="mt-2 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
      
      <CardFooter className="border-t border-border bg-muted/20 px-6 py-3">
        <div className="flex w-full items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardFooter>
    </Card>
  );
}