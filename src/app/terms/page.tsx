import { APP_CONFIG } from "@/constants";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <h1 className="text-2xl font-semibold text-foreground">Terms of Service</h1>
          <p className="text-muted-foreground mt-1">Last updated: {new Date().getFullYear()}</p>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <section>
          <p className="text-muted-foreground">
            By using {APP_CONFIG.name}, you agree to these Terms. Please read them carefully.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">Use of the Service</h2>
          <ul className="mt-2 list-disc pl-5 text-muted-foreground space-y-1">
            <li>You must provide accurate account information.</li>
            <li>Do not misuse, disrupt, or attempt to break security features.</li>
            <li>Respect copyrights for any content you upload.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">Content</h2>
          <p className="mt-2 text-muted-foreground">
            Dhamma posts and audio are offered for learning and practice. Some materials may be provided by third parties.
            We do not guarantee the accuracy of external content.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">Privacy</h2>
          <p className="mt-2 text-muted-foreground">
            Your use of the Service is also governed by our Privacy Policy. Please review it to understand how we handle
            your data.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">Termination</h2>
          <p className="mt-2 text-muted-foreground">
            We may suspend or terminate access if we detect abuse or violations of these Terms.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">Disclaimer</h2>
          <p className="mt-2 text-muted-foreground">
            Meditation guidance is provided for educational purposes and well-being. It is not a substitute for medical
            or psychological treatment.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">Contact</h2>
          <p className="mt-2 text-muted-foreground">
            For any questions regarding these Terms, please contact us via the Contact page.
          </p>
        </section>
      </main>
    </div>
  );
}
