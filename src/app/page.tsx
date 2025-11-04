'use client';

import Link from "next/link";
import { APP_CONFIG } from "@/constants";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useState } from "react";

export default function Home() {
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Navigation Header - Apple style glassmorphism */}
      <nav className="fixed top-0 w-full glass z-50">
        <div className="max-w-[1120px] mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-[52px]">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[var(--primary)] rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-[21px] font-semibold text-[var(--foreground)]">
                {APP_CONFIG.name}
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-[14px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                {t('navigation.features')}
              </Link>
              <Link href="#about" className="text-[14px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                {t('navigation.about')}
              </Link>
              <Link href="/contact" className="text-[14px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                {t('navigation.contact')}
              </Link>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <LanguageSwitcher />
              <Link
                href="/auth"
                className="text-[14px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                {t('auth.sign_in')}
              </Link>
              <Link
                href="/auth?mode=register"
                className="btn-apple btn-primary text-[14px]"
              >
                {t('home.hero.start_journey')}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-3">
              <LanguageSwitcher />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-[var(--border)]">
              <div className="flex flex-col space-y-1">
                <Link
                  href="#features"
                  className="text-[14px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors px-3 py-2 rounded-lg hover:bg-[var(--muted)]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('navigation.features')}
                </Link>
                <Link
                  href="#about"
                  className="text-[14px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors px-3 py-2 rounded-lg hover:bg-[var(--muted)]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('navigation.about')}
                </Link>
                <Link
                  href="/contact"
                  className="text-[14px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors px-3 py-2 rounded-lg hover:bg-[var(--muted)]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('navigation.contact')}
                </Link>
                <div className="pt-2 border-t border-[var(--border)] mt-2">
                  <Link
                    href="/auth"
                    className="block w-full text-center px-4 py-2 text-[14px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('auth.sign_in')}
                  </Link>
                  <Link
                    href="/auth?mode=register"
                    className="btn-apple btn-primary block w-full text-center mt-2 text-[14px]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('home.hero.start_journey')}
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-[120px] pb-[80px] px-6">
        <div className="max-w-[980px] mx-auto text-center fade-in">
          <h1 className="text-[56px] leading-[1.07] font-semibold text-[var(--foreground)] mb-6 tracking-tight">
            {t('home.hero.title')}
          </h1>
          <p className="text-[28px] leading-[1.14] font-normal text-[var(--foreground)] mb-2 tracking-tight">
            {t('home.hero.subtitle')}
          </p>
          <p className="text-[21px] leading-[1.381] text-[var(--muted-foreground)] max-w-[720px] mx-auto mb-8">
            {t('home.hero.description')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 fade-in fade-in-delay-1">
            <Link
              href="/auth?mode=register"
              className="btn-apple btn-primary text-[17px] px-6 w-full sm:w-auto"
            >
              {t('home.hero.start_journey')}
              <svg className="ml-2 w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/auth"
              className="btn-apple btn-secondary text-[17px] px-6 w-full sm:w-auto"
            >
              {t('home.hero.sign_in')}
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-[740px] mx-auto fade-in fade-in-delay-2">
            <div className="text-center">
              <div className="text-[48px] leading-[1.08] font-semibold text-[var(--primary)] mb-1">10+</div>
              <div className="text-[17px] text-[var(--muted-foreground)]">{t('home.stats.meditation_types')}</div>
            </div>
            <div className="text-center">
              <div className="text-[48px] leading-[1.08] font-semibold text-[var(--primary)] mb-1">24/7</div>
              <div className="text-[17px] text-[var(--muted-foreground)]">{t('home.stats.available')}</div>
            </div>
            <div className="text-center">
              <div className="text-[48px] leading-[1.08] font-semibold text-[var(--primary)] mb-1">100%</div>
              <div className="text-[17px] text-[var(--muted-foreground)]">{t('home.stats.free')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-[80px] px-6 bg-[var(--muted)]">
        <div className="max-w-[1120px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[48px] leading-[1.08] font-semibold text-[var(--foreground)] mb-4 tracking-tight">
              {t('home.features.title')}
            </h2>
            <p className="text-[21px] leading-[1.381] text-[var(--muted-foreground)] max-w-[640px] mx-auto">
              {t('home.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="card-elevated p-8">
              <div className="w-12 h-12 bg-[var(--primary)] rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-[24px] font-semibold text-[var(--foreground)] mb-3 tracking-tight">
                {t('home.features.smart_timer.title')}
              </h3>
              <p className="text-[17px] text-[var(--muted-foreground)] leading-[1.47]">
                {t('home.features.smart_timer.description')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card-elevated p-8">
              <div className="w-12 h-12 bg-[var(--secondary)] rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-[24px] font-semibold text-[var(--foreground)] mb-3 tracking-tight">
                {t('home.features.progress_tracking.title')}
              </h3>
              <p className="text-[17px] text-[var(--muted-foreground)] leading-[1.47]">
                {t('home.features.progress_tracking.description')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card-elevated p-8">
              <div className="w-12 h-12 bg-[var(--success)] rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-[24px] font-semibold text-[var(--foreground)] mb-3 tracking-tight">
                {t('home.features.dhamma_library.title')}
              </h3>
              <p className="text-[17px] text-[var(--muted-foreground)] leading-[1.47]">
                {t('home.features.dhamma_library.description')}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card-elevated p-8">
              <div className="w-12 h-12 bg-[var(--warning)] rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </div>
              <h3 className="text-[24px] font-semibold text-[var(--foreground)] mb-3 tracking-tight">
                {t('home.features.audio_collection.title')}
              </h3>
              <p className="text-[17px] text-[var(--muted-foreground)] leading-[1.47]">
                {t('home.features.audio_collection.description')}
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card-elevated p-8">
              <div className="w-12 h-12 bg-[var(--destructive)] rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-[24px] font-semibold text-[var(--foreground)] mb-3 tracking-tight">
                {t('home.features.session_logbook.title')}
              </h3>
              <p className="text-[17px] text-[var(--muted-foreground)] leading-[1.47]">
                {t('home.features.session_logbook.description')}
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card-elevated p-8">
              <div className="w-12 h-12 bg-[var(--primary)] rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-[24px] font-semibold text-[var(--foreground)] mb-3 tracking-tight">
                {t('home.features.privacy_security.title')}
              </h3>
              <p className="text-[17px] text-[var(--muted-foreground)] leading-[1.47]">
                {t('home.features.privacy_security.description')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div id="about" className="py-[110px] px-6">
        <div className="max-w-[1120px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-[48px] leading-[1.08] font-semibold text-[var(--foreground)] mb-6 tracking-tight">
                {t('home.about.title')}
                <span className="block text-[var(--primary)]">{t('home.about.subtitle')}</span>
              </h2>
              <p className="text-[21px] leading-[1.381] text-[var(--muted-foreground)] mb-6">
                {t('home.about.description')}
              </p>
              <p className="text-[17px] leading-[1.47] text-[var(--muted-foreground)] mb-8">
                {t('home.about.subdescription')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth?mode=register"
                  className="btn-apple btn-primary text-[17px] px-6"
                >
                  {t('home.about.start_free')}
                </Link>
                <Link
                  href="/contact"
                  className="btn-apple btn-secondary text-[17px] px-6"
                >
                  {t('home.about.learn_more')}
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="card-elevated p-10 text-center">
                <div className="w-16 h-16 bg-[var(--primary)] bg-opacity-10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-[28px] font-semibold text-[var(--foreground)] mb-3 tracking-tight">
                  {t('home.about.community.title')}
                </h3>
                <p className="text-[17px] text-[var(--muted-foreground)] mb-6 leading-[1.47]">
                  {t('home.about.community.description')}
                </p>
                <div className="text-[48px] font-semibold text-[var(--primary)] leading-[1.08]">10,000+</div>
                <div className="text-[17px] text-[var(--muted-foreground)]">{t('home.about.community.active_users')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-[110px] px-6 bg-[var(--primary)] text-white">
        <div className="max-w-[980px] mx-auto text-center">
          <h2 className="text-[48px] leading-[1.08] font-semibold mb-6 tracking-tight">
            {t('home.cta.title')}
          </h2>
          <p className="text-[21px] leading-[1.381] opacity-90 mb-12 max-w-[720px] mx-auto">
            {t('home.cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth?mode=register"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-[var(--primary)] font-semibold text-[17px] rounded-[var(--radius)] hover:bg-gray-100 transition-all"
            >
              {t('home.cta.create_account')}
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white font-semibold text-[17px] rounded-[var(--radius)] hover:bg-white hover:bg-opacity-10 transition-all"
            >
              {t('home.cta.sign_in')}
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[var(--muted)] py-16 px-6">
        <div className="max-w-[1120px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-[var(--primary)] rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <span className="text-[17px] font-semibold text-[var(--foreground)]">{APP_CONFIG.name}</span>
              </div>
              <p className="text-[14px] text-[var(--muted-foreground)] mb-4 max-w-md leading-[1.43]">
                {t('footer.description')}
              </p>
            </div>

            <div>
              <h3 className="text-[14px] font-semibold text-[var(--foreground)] mb-4">{t('footer.features')}</h3>
              <ul className="space-y-2">
                <li><Link href="/meditate" className="text-[14px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">{t('navigation.meditate')}</Link></li>
                <li><Link href="/logbook" className="text-[14px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">{t('navigation.logbook')}</Link></li>
                <li><Link href="/dhamma" className="text-[14px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">{t('navigation.dhamma')}</Link></li>
                <li><Link href="/kamatahan" className="text-[14px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">{t('navigation.kamatahan')}</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-[14px] font-semibold text-[var(--foreground)] mb-4">{t('footer.support')}</h3>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-[14px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">{t('navigation.contact')}</Link></li>
                <li><Link href="/help" className="text-[14px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">Help Center</Link></li>
                <li><Link href="/privacy" className="text-[14px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-[14px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-[12px] text-[var(--muted-foreground)]">
                © {new Date().getFullYear()} {APP_CONFIG.name}. {t('footer.copyright', { author: APP_CONFIG.author })}.
              </p>
              <p className="text-[12px] text-[var(--muted-foreground)] mt-4 md:mt-0">
                {t('footer.blessing')}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
