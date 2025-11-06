import Link from "next/link";
import { APP_CONFIG } from "@/constants";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white dark:bg-gray-800 border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Help Center</h1>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">Back to Home</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-foreground">Getting Started</h2>
          <p className="mt-2 text-muted-foreground">
            {APP_CONFIG.name} helps you build a steady meditation habit. Create an account, choose a
            meditation type, and start a timed session. Your progress and notes are saved to your Logbook.
          </p>
        </section>
        <section>
          <h3 className="text-lg font-semibold text-foreground">Meditation Timer</h3>
          <ul className="mt-2 list-disc pl-5 text-muted-foreground space-y-1">
            <li>Runs reliably, even if the tab sleeps; duration is computed from wall clock when needed.</li>
            <li>Reflect after a session to add notes, mood, rating, distractions, and insights.</li>
            <li>Sessions appear in your Logbook and Analytics automatically.</li>
          </ul>
        </section>
        <section>
          <h3 className="text-lg font-semibold text-foreground">Logbook</h3>
          <ul className="mt-2 list-disc pl-5 text-muted-foreground space-y-1">
            <li>Switch between List and Calendar views.</li>
            <li>Tap a note to view the full text in a readable modal.</li>
            <li>Use filters to find sessions by type, date, mood, or rating.</li>
          </ul>
        </section>
        <section>
          <h3 className="text-lg font-semibold text-foreground">Audio & Playlists</h3>
          <ul className="mt-2 list-disc pl-5 text-muted-foreground space-y-1">
            <li>Listen to guided audio and admin-curated public playlists.</li>
            <li>Admin can create and edit playlists; users can browse and play.</li>
          </ul>
        </section>
        <section>
          <h3 className="text-lg font-semibold text-foreground">Language & Appearance</h3>
          <ul className="mt-2 list-disc pl-5 text-muted-foreground space-y-1">
            <li>Switch between English and Sinhala in Settings.</li>
            <li>Pick your theme accent and radius; changes apply across the app.</li>
          </ul>
        </section>
        <section>
          <h3 className="text-lg font-semibold text-foreground">Troubleshooting</h3>
          <ul className="mt-2 list-disc pl-5 text-muted-foreground space-y-1">
            <li>If the timer seems off, update to the latest version and keep the page open; we sync using start/end time.</li>
            <li>If translations don’t appear, try switching language off/on in Settings.</li>
            <li>For account or data issues, contact us via the Contact page.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

