import { APP_CONFIG } from "@/constants";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white dark:bg-gray-800 border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <h1 className="text-2xl font-semibold text-foreground">Privacy Policy</h1>
          <p className="text-muted-foreground mt-1">Last updated: {new Date().getFullYear()}</p>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <section>
          <p className="text-muted-foreground">
            This Privacy Policy explains how {APP_CONFIG.name} (&quot;we&quot;, &quot;us&quot;) collects, uses, and protects your
            information when you use our app.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">Information We Collect</h2>
          <ul className="mt-2 list-disc pl-5 text-muted-foreground space-y-1">
            <li>Account data: email, display name, photo (if provided)</li>
            <li>Meditation data: session start/end, duration, type, optional notes</li>
            <li>Preferences: language, theme, and app settings</li>
            <li>Reading/Listening: basic counters for Dhamma reads and audio sessions</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">How We Use Your Data</h2>
          <ul className="mt-2 list-disc pl-5 text-muted-foreground space-y-1">
            <li>To run core features like the timer, logbook, analytics, and playlists</li>
            <li>To personalize your experience (language and theme)</li>
            <li>To improve reliability and product quality</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">Storage & Security</h2>
          <p className="mt-2 text-muted-foreground">
            We use Firebase Authentication and Firestore. Access to admin-only data is restricted. Your data is stored
            securely, and we do not sell your personal information.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">Cookies</h2>
          <p className="mt-2 text-muted-foreground">
            We set a lightweight cookie (ni_auth=1) to enable a seamless redirect to the dashboard when you are signed in.
            This cookie does not track you across sites.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">Your Choices</h2>
          <ul className="mt-2 list-disc pl-5 text-muted-foreground space-y-1">
            <li>Export or delete your data from Settings &rarr; Data &amp; Privacy</li>
            <li>Change language and theme in Settings &rarr; Preferences</li>
            <li>Contact us for account questions or data requests</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">Contact</h2>
          <p className="mt-2 text-muted-foreground">
            For any privacy inquiries, please contact us via the Contact page.
          </p>
        </section>
      </main>
    </div>
  );
}

