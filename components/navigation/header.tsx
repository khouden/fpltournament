import * as React from "react";
import { DesktopHeader } from "@/components/navigation/desktop-header";
import { MobileHeader } from "@/components/navigation/mobile-header";

export function Header() {
  return (
    <>
      <DesktopHeader />
      <MobileHeader />
    </>
  );
}
