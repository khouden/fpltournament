import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/navigation/header";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { ContactCardsClient } from "@/components/create-tournament/contact-cards-client";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Create Tournament — FPL Tournaments",
  description:
    "Self-service tournament creation is coming soon. Contact the admin on WhatsApp, Instagram, or Email to set up your custom tournament today.",
};

export default function CreateTournamentPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FB] text-[#0B081E]">
      {/* Global Header */}
      <Header />

      <main className="flex-1 pb-16 sm:pb-20">
        {/* HEADER SECTION */}
        <section className="bg-white border-b border-[#E2E8F0] pt-8 sm:pt-10 pb-10 sm:pb-12">
          <Container>
            <div className="max-w-2xl mx-auto text-center">
              {/* Back to Tournaments */}
              <div className="mb-4 inline-flex">
                <Link
                  href="/tournaments"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#0B081E] transition-colors py-1 px-3 rounded-full bg-[#F8F9FB] border border-[#E2E8F0] hover:border-gray-300"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Tournaments</span>
                </Link>
              </div>

              {/* Status Pill */}
              <div className="flex justify-center mb-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#008756]/10 border border-[#008756]/20 px-3 py-1 text-[11px] font-bold text-[#008756] uppercase tracking-wide">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#008756] opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#008756]" />
                  </span>
                  Coming Soon
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#0B081E]">
                Create a Tournament
              </h1>

              {/* Concise Message */}
              <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed max-w-lg mx-auto">
                Automated self-service tournament creation is coming soon. In the meantime, you can contact
                the admin directly to set up and launch your custom tournament right away!
              </p>
            </div>
          </Container>
        </section>

        {/* DIRECT CHANNELS (IMMEDIATELY VISIBLE) */}
        <section className="pt-8 sm:pt-10 pb-12">
          <Container>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-lg sm:text-xl font-black text-[#0B081E] tracking-tight">
                  Contact Admin Directly
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Reach out via your preferred channel with your league details:
                </p>
              </div>

              {/* 3 Contact Cards */}
              <ContactCardsClient />
            </div>
          </Container>
        </section>

        {/* 4 QUICK STEPS */}
        <section className="border-t border-[#E2E8F0] pt-10 pb-6">
          <Container>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#37003C]">
                  How Admin Setup Works
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl bg-white border border-[#E2E8F0] p-4 text-center">
                  <div className="text-xs font-black text-[#128C7E] bg-[#E8FBF0] w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-2">
                    1
                  </div>
                  <h4 className="text-sm font-bold text-[#0B081E]">Contact Admin</h4>
                  <p className="text-xs text-gray-500 mt-1">Send a message on WhatsApp, Instagram, or Email.</p>
                </div>

                <div className="rounded-xl bg-white border border-[#E2E8F0] p-4 text-center">
                  <div className="text-xs font-black text-[#1689E8] bg-[#EFF6FF] w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-2">
                    2
                  </div>
                  <h4 className="text-sm font-bold text-[#0B081E]">Share League Link</h4>
                  <p className="text-xs text-gray-500 mt-1">Provide your FPL classic league code or link.</p>
                </div>

                <div className="rounded-xl bg-white border border-[#E2E8F0] p-4 text-center">
                  <div className="text-xs font-black text-[#A16207] bg-[#FEF9C3] w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-2">
                    3
                  </div>
                  <h4 className="text-sm font-bold text-[#0B081E]">Choose Format</h4>
                  <p className="text-xs text-gray-500 mt-1">Select knockout, group stage, and start Gameweek.</p>
                </div>

                <div className="rounded-xl bg-white border border-[#E2E8F0] p-4 text-center">
                  <div className="text-xs font-black text-[#DD2A7B] bg-[#FDF0F5] w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-2">
                    4
                  </div>
                  <h4 className="text-sm font-bold text-[#0B081E]">Go Live</h4>
                  <p className="text-xs text-gray-500 mt-1">Get your live tournament link to share with managers.</p>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
