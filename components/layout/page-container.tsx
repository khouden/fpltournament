import * as React from "react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/layout/container";

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "default" | "large" | "narrow" | "full";
  noPadding?: boolean;
}

export function PageContainer({
  children,
  size = "default",
  noPadding = false,
  className,
  ...props
}: PageContainerProps) {
  return (
    <main
      className={cn(
        "flex-1 w-full",
        !noPadding && "py-8 sm:py-12",
        className
      )}
      {...props}
    >
      <Container size={size}>{children}</Container>
    </main>
  );
}
