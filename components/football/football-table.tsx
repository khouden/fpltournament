import * as React from "react";
import { cn } from "@/lib/utils";

export function FootballTable({
  children,
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-[10px] border border-[#E5E5E5] bg-white shadow-fpl-sm">
      <table className={cn("w-full text-left text-sm", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function FootballTableHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        "border-b border-[#E5E5E5] bg-[#F7F7F7] text-[11px] font-extrabold uppercase tracking-wider text-[#777777]",
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

export function FootballTableRow({
  children,
  className,
  highlight = false,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { highlight?: boolean }) {
  return (
    <tr
      className={cn(
        "h-12 sm:h-14 border-b border-[#EEEEEE] transition-colors hover:bg-[#F9F9F9] last:border-b-0",
        highlight && "bg-[#00FF87]/5 font-semibold",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function FootballTableHead({
  children,
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn("px-4 py-3 font-extrabold text-inherit", className)} {...props}>
      {children}
    </th>
  );
}

export function FootballTableCell({
  children,
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("px-4 py-3 text-[#1F1F1F]", className)} {...props}>
      {children}
    </td>
  );
}
