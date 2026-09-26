"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Flower2 } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AnonymousLogin } from "@/components/auth/AnonymousLogin";
import { APP_CONFIG } from "@/constants";
import styles from "./auth.module.css";

type AuthMode = "login" | "register" | "anonymous";

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  return (
    <main className={styles.page}>
      <section className={styles.visual} aria-label="Meditation and guidance">
        <Link href="/" className={styles.brand}>
          <Flower2 size={30} strokeWidth={1.5} aria-hidden="true" />
          <span>{APP_CONFIG.name}</span>
        </Link>
        <div className={styles.artwork}>
          <Image
            src="/images/login-guidance.png"
            alt="A student respectfully listening to a Buddhist monk's guidance"
            fill
            priority
            sizes="(max-width: 760px) 185px, 54vw"
            className={styles.image}
          />
        </div>
        <div className={styles.caption}>
          <span className={styles.captionLine} aria-hidden="true" />
          <p>
            A little stillness.
            <br />A meaningful beginning.
          </p>
        </div>
      </section>
      <section className={styles.panel} aria-label="Your account">
        <Link href="/" className={styles.back}>
          <ArrowLeft size={16} aria-hidden="true" /> Back to home
        </Link>
        <div className={styles.formArea}>
          <div className={styles.formMark} aria-hidden="true">
            <Flower2 size={26} strokeWidth={1.5} />
          </div>
          <div className={styles.form}>
            {authMode === "login" && (
              <LoginForm
                onSwitchToRegister={() => setAuthMode("register")}
                onSwitchToAnonymous={() => setAuthMode("anonymous")}
              />
            )}
            {authMode === "register" && (
              <RegisterForm onSwitchToLogin={() => setAuthMode("login")} />
            )}
            {authMode === "anonymous" && (
              <AnonymousLogin
                onSwitchToLogin={() => setAuthMode("login")}
                onSwitchToRegister={() => setAuthMode("register")}
              />
            )}
          </div>
        </div>
        <p className={styles.legal}>
          By continuing, you agree to our{" "}
          <Link href="/terms">Terms of Service</Link> and{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </section>
    </main>
  );
}
