'use client';

import Link from "next/link";
import { APP_CONFIG } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useEffect, useState } from "react";

export default function Home() {
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect signed-in users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  // Keep UI minimal while auth state resolves
  if (loading) {
    return <div className="min-h-screen bg-background" />;
  }

  // If user is signed in, redirect to dashboard (clientâ€‘side)
  if (!loading && user) {
    // Use replace so back button doesnâ€™t return to home
    router.replace('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f7f4] via-[#f5f3f0] to-[#f0f9f4]">
      {/* Navigation Header */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {APP_CONFIG.name}
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-slate-600 hover:text-[var(--primary)] transition-colors">
                {t('navigation.features')}
              </Link>
              <Link href="#about" className="text-slate-600 hover:text-[var(--primary)] transition-colors">
                {t('navigation.about')}
              </Link>
              <Link href="/contact" className="text-slate-600 hover:text-[var(--primary)] transition-colors">
                {t('navigation.contact')}
              </Link>
            </div>

            {/* Desktop Auth Buttons (hide when logged in) */}
            {!user && (
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  href="/auth"
                  className="inline-flex items-center px-4 py-2 text-slate-600 hover:text-[var(--primary)] transition-colors"
                >
                  {t('auth.sign_in')}
                </Link>
                <Link
                  href="/auth?mode=register"
                  className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  {t('home.hero.start_journey')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-3">              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
             <div className="md:hidden py-4 border-t border-slate-200">
               <div className="flex flex-col space-y-3">
                <Link 
                  href="#features" 
                  className="text-slate-600 hover:text-[var(--primary)] transition-colors px-3 py-2 rounded-lg hover:bg-slate-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('navigation.features')}
                </Link>
                <Link 
                  href="#about" 
                  className="text-slate-600 hover:text-[var(--primary)] transition-colors px-3 py-2 rounded-lg hover:bg-slate-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('navigation.about')}
                </Link>
                <Link 
                  href="/contact" 
                  className="text-slate-600 hover:text-[var(--primary)] transition-colors px-3 py-2 rounded-lg hover:bg-slate-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('navigation.contact')}
                </Link>
                {!user && (
                  <div className="pt-2 border-t border-slate-200">
                    <Link
                      href="/auth"
                      className="block w-full text-center px-4 py-2 text-slate-600 hover:text-[var(--primary)] transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('auth.sign_in')}
                    </Link>
                    <Link
                      href="/auth?mode=register"
                      className="block w-full text-center mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('home.hero.start_journey')}
                    </Link>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('common.language')}</h4>
                <LanguageSwitcher />
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-20 pb-16 sm:pt-24 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6 sm:mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl mb-6 sm:mb-8 shadow-2xl">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 sm:mb-8 leading-tight px-4">
                {t('home.hero.title')}
                <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {t('home.hero.subtitle')}
                </span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed mb-8 sm:mb-12 px-4">
                {t('home.hero.description')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 sm:mb-16 px-4">
              <Link
                href="/auth?mode=register"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-base sm:text-lg rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-2xl hover:shadow-3xl"
              >
                {t('home.hero.start_journey')}
                <svg className="ml-2 sm:ml-3 w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/auth"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-4 border-2 border-slate-300 text-slate-700 font-semibold text-base sm:text-lg rounded-xl hover:bg-slate-50 transition-all duration-200"
              >
                {t('home.hero.sign_in')}
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-3xl mx-auto px-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-[var(--primary)] mb-2">10+</div>
                <div className="text-sm sm:text-base text-slate-600">{t('home.stats.meditation_types')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-indigo-600 mb-2">24/7</div>
                <div className="text-sm sm:text-base text-slate-600">{t('home.stats.available')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-[var(--primary)] mb-2">100%</div>
                <div className="text-sm sm:text-base text-slate-600">{t('home.stats.free')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements - Hidden on mobile for performance */}
        <div className="hidden md:block absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="hidden md:block absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="hidden md:block absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-6 px-4">
              {t('home.features.title')}
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto px-4">
              {t('home.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="group bg-gradient-to-br from-blue-50 to-blue-100 p-6 sm:p-8 rounded-2xl border border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">{t('home.features.smart_timer.title')}</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {t('home.features.smart_timer.description')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-gradient-to-br from-purple-50 to-purple-100 p-6 sm:p-8 rounded-2xl border border-purple-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">{t('home.features.progress_tracking.title')}</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {t('home.features.progress_tracking.description')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-gradient-to-br from-green-50 to-green-100 p-6 sm:p-8 rounded-2xl border border-green-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">{t('home.features.dhamma_library.title')}</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {t('home.features.dhamma_library.description')}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 sm:p-8 rounded-2xl border border-yellow-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">{t('home.features.audio_collection.title')}</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {t('home.features.audio_collection.description')}
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group bg-gradient-to-br from-red-50 to-red-100 p-6 sm:p-8 rounded-2xl border border-[var(--color-status-error)] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">{t('home.features.session_logbook.title')}</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {t('home.features.session_logbook.description')}
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 sm:p-8 rounded-2xl border border-indigo-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">{t('home.features.privacy_security.title')}</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {t('home.features.privacy_security.description')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div id="about" className="py-24 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8">
                {t('home.about.title')}
                <span className="block text-[var(--primary)]">{t('home.about.subtitle')}</span>
              </h2>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                {t('home.about.description')}
              </p>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                {t('home.about.subdescription')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth?mode=register"
                  className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
                >
                  {t('home.about.start_free')}
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all duration-200"
                >
                  {t('home.about.learn_more')}
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 shadow-2xl">
                <div className="text-white text-center">
                  <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{t('home.about.community.title')}</h3>
                  <p className="text-[color:rgba(255,255,255,0.8)] mb-6">
                    {t('home.about.community.description')}
                  </p>
                  <div className="text-3xl font-bold">10,000+</div>
                  <div className="text-[color:rgba(255,255,255,0.8)]">{t('home.about.community.active_users')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Language Switcher */}
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-2xl p-6 flex items-center justify-between flex-col sm:flex-row gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-semibold text-slate-900">{t('common.language')}</h3>
              <p className="text-slate-600 text-sm">Choose your preferred language.</p>
            </div>          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            {t('home.cta.title')}
          </h2>
          <p className="text-xl text-[color:rgba(255,255,255,0.8)] mb-12 max-w-3xl mx-auto">
            {t('home.cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/auth?mode=register"
              className="inline-flex items-center justify-center px-10 py-4 bg-white text-[var(--primary)] font-bold text-lg rounded-xl hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-2xl"
            >
              {t('home.cta.create_account')}
              <svg className="ml-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center px-10 py-4 border-2 border-white text-white font-bold text-lg rounded-xl hover:bg-white hover:text-[var(--primary)] transition-all duration-200"
            >
              {t('home.cta.sign_in')}
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <span className="text-xl font-bold">{APP_CONFIG.name}</span>
              </div>
              <p className="text-slate-400 mb-4 max-w-md">
                {t('footer.description')}
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('footer.features')}</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/meditate" className="hover:text-white transition-colors">{t('navigation.meditate')}</Link></li>
                <li><Link href="/logbook" className="hover:text-white transition-colors">{t('navigation.logbook')}</Link></li>
                <li><Link href="/dhamma" className="hover:text-white transition-colors">{t('navigation.dhamma')}</Link></li>
                <li><Link href="/kamatahan" className="hover:text-white transition-colors">{t('navigation.kamatahan')}</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('footer.support')}</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/contact" className="hover:text-white transition-colors">{t('navigation.contact')}</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-slate-400 text-sm">
                © {new Date().getFullYear()} {APP_CONFIG.name}. {t('footer.copyright', { author: APP_CONFIG.author })}.
              </p>
              <p className="text-slate-500 text-sm mt-4 md:mt-0">
                {t('footer.blessing')}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}



