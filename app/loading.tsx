import { Header } from "@/components/navigation/header";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { Skeleton, CardSkeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FB] text-[#1F1F1F]">
      <Header />
      <main className="flex-1 py-12">
        <Container className="space-y-8 animate-fpl-fade-in">
          {/* Header shimmer */}
          <div className="space-y-3 max-w-xl">
            <Skeleton className="h-8 sm:h-10 w-3/4 rounded-xl" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-2/3 rounded-md" />
          </div>

          {/* Quick stats skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[#E8ECF2] bg-white p-5 space-y-2 shadow-xs"
              >
                <Skeleton className="h-3.5 w-20 rounded" />
                <Skeleton className="h-7 w-24 rounded-lg" />
              </div>
            ))}
          </div>

          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
