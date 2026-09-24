"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePlayer } from "@/contexts/PlayerContext";
import { usePathname } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  checkinDay,
  type CheckinAnswer,
  type CheckinQuestion,
} from "@/lib/checkins";
import { saveCheckin } from "@/lib/checkinTransactions";
import { parsePractice, practiceStorageKey } from "@/lib/meditationClock";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { Check, ClipboardCheck } from "lucide-react";

interface CheckinState {
  questions: CheckinQuestion[];
  answers: CheckinAnswer[];
  today: CheckinAnswer[];
  day: string;
  loading: boolean;
  error: boolean;
  open: () => void;
  retry: () => void;
}
const Context = createContext<CheckinState | null>(null);
export const useCheckins = () => useContext(Context);

export function CheckinProvider({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) {
  const { user } = useAuth();
  return (
    <OwnerCheckins
      key={user?.id || "signed-out"}
      uid={user?.id}
      enabled={enabled}
    >
      {children}
    </OwnerCheckins>
  );
}

function OwnerCheckins({
  children,
  uid,
  enabled,
}: {
  children: ReactNode;
  uid?: string;
  enabled: boolean;
}) {
  const { t, language } = useLanguage();
  const pathname = usePathname();
  const { isPlaying } = usePlayer();
  const [day, setDay] = useState(() => checkinDay().day);
  const [questions, setQuestions] = useState<CheckinQuestion[]>([]);
  const [answers, setAnswers] = useState<CheckinAnswer[]>([]);
  const [loaded, setLoaded] = useState({ questions: false, answers: false });
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [wake, setWake] = useState(0);
  const mayPrompt = useRef(true);
  const saving = useRef(false);
  const today = useMemo(
    () => answers.filter((answer) => answer.day === day),
    [answers, day],
  );
  const answered = questions.filter((question) =>
    today.some((answer) => answer.questionId === question.id),
  ).length;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function refresh() {
      const next = checkinDay();
      setDay((previous) => {
        if (previous !== next.day) {
          mayPrompt.current = true;
        }
        return next.day;
      });
      clearTimeout(timer);
      timer = setTimeout(
        refresh,
        Math.min(60_000, next.end.getTime() - Date.now() + 25),
      );
      setWake((value) => value + 1);
    }
    function visible() {
      if (!document.hidden) {
        mayPrompt.current = true;
        refresh();
      }
    }
    function online() {
      setAttempt((value) => value + 1);
    }
    refresh();
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("online", online);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("online", online);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
    setSaveError(false);
    if (!uid || !enabled) return;
    setLoaded({ questions: false, answers: false });
    setError(false);
    setAnswers([]);
    const start = new Date();
    start.setDate(start.getDate() - 29);
    const fail = () => setError(true);
    const stopQuestions = onSnapshot(
      query(
        collection(db, "daily_checkin_questions"),
        where("status", "==", "active"),
      ),
      { includeMetadataChanges: true },
      (snapshot) => {
        setQuestions(
          snapshot.docs
            .map((item) => ({ ...item.data(), id: item.id }) as CheckinQuestion)
            .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)),
        );
        setLoaded((value) => ({
          ...value,
          questions: !snapshot.metadata.fromCache,
        }));
      },
      fail,
    );
    const stopAnswers = onSnapshot(
      query(
        collection(db, "users", uid, "daily_checkins"),
        where("day", ">=", checkinDay(start).day),
        where("day", "<=", day),
      ),
      { includeMetadataChanges: true },
      (snapshot) => {
        setAnswers(
          snapshot.docs.map(
            (item) => ({ ...item.data(), id: item.id }) as CheckinAnswer,
          ),
        );
        setLoaded((value) => ({
          ...value,
          answers: !snapshot.metadata.fromCache,
        }));
      },
      fail,
    );
    const offline = () => setError(true);
    window.addEventListener("offline", offline);
    if (!navigator.onLine) setError(true);
    return () => {
      stopQuestions();
      stopAnswers();
      window.removeEventListener("offline", offline);
    };
  }, [uid, day, attempt, enabled]);

  const loading = !loaded.questions || !loaded.answers;
  const safeRoute =
    enabled &&
    !pathname.startsWith("/meditate") &&
    !pathname.startsWith("/guides") &&
    !isPlaying;
  useEffect(() => {
    if (!safeRoute) {
      setOpen(false);
      return;
    }
    if (
      !uid ||
      loading ||
      error ||
      !questions.length ||
      answered === questions.length ||
      !mayPrompt.current ||
      document.hidden
    )
      return;
    try {
      const practice = parsePractice(
        localStorage.getItem(practiceStorageKey(uid)),
        uid,
      );
      if (practice && practice.phase !== "finished") return;
    } catch {
      /* Storage is optional. */
    }
    if (document.querySelector("dialog[open]")) return;
    mayPrompt.current = false;
    setOpen(true);
  }, [uid, safeRoute, loading, error, questions.length, answered, wake]);

  function close() {
    if (!saving.current) {
      mayPrompt.current = false;
      setOpen(false);
      setSaveError(false);
    }
  }
  async function answer(questionId: string, value: boolean) {
    if (!uid || saving.current) return;
    if (checkinDay().day !== day) {
      setDay(checkinDay().day);
      mayPrompt.current = true;
      return;
    }
    saving.current = true;
    setBusy(questionId);
    setSaveError(false);
    try {
      await saveCheckin(
        db,
        uid,
        questionId,
        value,
        day,
        questions.find((question) => question.id === questionId)?.version,
      );
    } catch {
      setSaveError(true);
    } finally {
      saving.current = false;
      setBusy(null);
    }
  }
  return (
    <Context.Provider
      value={{
        questions,
        answers,
        today,
        day,
        loading,
        error,
        open: () => {
          mayPrompt.current = false;
          setOpen(true);
        },
        retry: () => setAttempt((value) => value + 1),
      }}
    >
      {children}
      <SettingsDialog
        open={open && enabled}
        titleId="checkin-title"
        busy={!!busy}
        onClose={close}
      >
        <div className="space-y-5 p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-primary/10 p-3 text-primary">
              <ClipboardCheck size={25} />
            </span>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t("checkin.daily")}
              </p>
              <h2 id="checkin-title" className="mt-1 text-xl font-semibold">
                {t("checkin.title")}
              </h2>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("checkin.hint")}
          </p>
          <p className="text-sm font-medium" aria-live="polite">
            {t("checkin.count", { count: answered, total: questions.length })}
          </p>
          <div className="space-y-3">
            {questions.map((question) => {
              const saved = today.find(
                (item) => item.questionId === question.id,
              );
              const label = saved || question;
              return (
                <fieldset
                  key={question.id}
                  disabled={!!busy || loading || error}
                  className="rounded-2xl border border-border p-4"
                >
                  <legend className="px-1 text-sm font-medium leading-relaxed">
                    {language === "si" ? label.titleSi : label.titleEn}
                  </legend>
                  <div className="mt-1 grid grid-cols-2 gap-3">
                    {[true, false].map((value) => (
                      <button
                        key={String(value)}
                        type="button"
                        aria-pressed={saved?.answer === value}
                        onClick={() => void answer(question.id, value)}
                        className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 font-medium disabled:opacity-50 ${saved?.answer === value ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background text-foreground"}`}
                      >
                        {saved?.answer === value && (
                          <Check size={17} aria-hidden="true" />
                        )}
                        {t(value ? "checkin.yes" : "checkin.no")}
                      </button>
                    ))}
                  </div>
                  {busy === question.id && (
                    <p
                      role="status"
                      className="mt-2 text-xs text-muted-foreground"
                    >
                      {t("checkin.saving")}
                    </p>
                  )}
                </fieldset>
              );
            })}
          </div>
          {(saveError || error) && (
            <p role="alert" className="text-sm">
              {t("checkin.save_error")}
            </p>
          )}
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("checkin.private")}
          </p>
          <button
            disabled={!!busy}
            onClick={close}
            className="min-h-12 w-full rounded-xl bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-50"
          >
            {t(
              answered === questions.length ? "checkin.done" : "checkin.later",
            )}
          </button>
        </div>
      </SettingsDialog>
    </Context.Provider>
  );
}
