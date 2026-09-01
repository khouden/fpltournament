import { revalidatePath } from "next/cache";

export function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Gracefully handle calling outside Next.js request context (e.g. CLI or tests)
  }
}
