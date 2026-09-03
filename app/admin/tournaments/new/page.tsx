import { TournamentForm } from "@/components/tournament-form";
import { Card, CardContent } from "@/components/ui/card";

export default function NewTournamentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Tournament</h1>
        <p className="mt-2 text-gray-600">
          Set up a new tournament for your FPL league
        </p>
      </div>

      <Card className="p-8 shadow-xs border-gray-200">
        <TournamentForm />
      </Card>
    </div>
  );
}
