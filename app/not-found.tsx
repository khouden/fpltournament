import type { Metadata } from "next";
import { Header } from "@/components/navigation/header";
import { Footer } from "@/components/layout/footer";
import { NotFoundContent } from "@/components/not-found/not-found-content";

export const metadata: Metadata = {
  title: "404: Page Not Found — FPL Tournaments",
  description: "The requested tournament, fixture, or page could not be found.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1F1F1F]">
      {/* Global Navigation Header */}
      <Header />

      {/* Main Simple Stage */}
      <main className="flex-1 flex flex-col justify-center">
        <NotFoundContent />
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
