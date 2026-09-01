import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-gray-900">
            Fantasy Leagues
          </h1>
          <p className="text-xl text-gray-600">
            Manage fantasy football tournaments and track match scores
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-lg bg-white p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900">For Players</h2>
            <p className="mt-3 text-gray-600">
              Browse active tournaments, view your matches, and track your
              scores.
            </p>
            <Link
              href="/tournaments"
              className="mt-6 inline-block rounded-md bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700"
            >
              View Tournaments
            </Link>
          </div>

          <div className="rounded-lg bg-white p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900">For Admins</h2>
            <p className="mt-3 text-gray-600">
              Create tournaments, manage groups, schedule matches, and publish
              results.
            </p>
            <Link
              href="/admin"
              className="mt-6 inline-block rounded-md bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700"
            >
              Admin Dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900">Features</h2>
          <ul className="mt-6 space-y-3 text-gray-600">
            <li>✓ Create and manage fantasy football tournaments</li>
            <li>✓ Import players from FPL leagues</li>
            <li>✓ Schedule matches and rounds</li>
            <li>✓ Automatic score calculation from FPL gameweek data</li>
            <li>✓ Public tournament pages with real-time results</li>
            <li>✓ Bracket progression tracking</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
