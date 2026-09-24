"use client";

import { Headphones, LoaderCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function ListeningState({
  loading,
  error,
  retry,
  empty,
}: {
  loading?: boolean;
  error?: boolean;
  retry?: () => void;
  empty?: string;
}) {
  const { t } = useLanguage();
  return (
    <div
      className="rounded-3xl border border-border bg-card px-6 py-12 text-center"
      role={error ? "alert" : "status"}
    >
      {loading ? (
        <LoaderCircle
          className="mx-auto mb-4 animate-spin text-muted-foreground"
          size={28}
          aria-hidden="true"
        />
      ) : (
        <Headphones
          className="mx-auto mb-4 text-muted-foreground"
          size={28}
          aria-hidden="true"
        />
      )}
      <p className="font-medium">
        {t(
          loading
            ? "common.loading"
            : error
              ? "listen.load_error"
              : empty || "listen.no_matches",
        )}
      </p>
      {error && (
        <button
          type="button"
          className="mt-4 min-h-11 rounded-xl bg-primary px-5 font-semibold text-primary-foreground"
          onClick={retry}
        >
          {t("listen.retry")}
        </button>
      )}
    </div>
  );
}
