'use client';

import Link from "next/link";
import { APP_CONFIG } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export default function Home() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const fetchAudio = async () => {
      try {
        const path = "audio/1762506621554_භාවනාව බෞද්ධයන්ට පමණක් ද  Most Ven.Na Uyane Ariyadhamma Maha Thero.aac";
        const url = await getDownloadURL(ref(storage, path));
        setAudioUrl(url);
      } catch (error) {
        console.error("Failed to load featured audio:", error);
      }
    };
    fetchAudio();
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Playback failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Redirect signed-in users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  // Keep UI minimal while auth state resolves
  if (loading) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  // If user is signed in, redirect to dashboard (client-side)
  if (!loading && user) {
    router.replace('/dashboard');
    return null;
  }

  // Animation variants
  const fadeIn: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Mock data for display
  const topics = [
    { title: "Stress Relief", color: "bg-blue-100 text-blue-700" },
    { title: "Better Sleep", color: "bg-purple-100 text-purple-700" },
    { title: "Focus", color: "bg-teal-100 text-teal-700" },
    { title: "Anxiety", color: "bg-orange-100 text-orange-700" },
    { title: "Self-Compassion", color: "bg-pink-100 text-pink-700" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F8FAFC]">
      {/* Dynamic Background Elements - Slightly more vibrant */}
      <div className="absolute top-[-20%] left-[-10%] w-[90vw] h-[90vw] bg-purple-200/50 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob" />
      <div className="absolute top-[-10%] right-[-20%] w-[80vw] h-[80vw] bg-blue-200/50 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-20%] left-[20%] w-[100vw] h-[100vw] bg-indigo-200/50 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob animation-delay-4000" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-white/0 backdrop-blur-[2px]">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight hidden sm:block">
            {APP_CONFIG.name}
          </span>
        </div>

        <Link
          href="/auth"
          className="text-sm font-semibold text-slate-600 hover:text-indigo-600 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:shadow-md transition-all"
        >
          {t('auth.sign_in')}
        </Link>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-lg mx-auto min-h-screen flex flex-col pt-24 pb-12 px-6">

        {/* Hero Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="text-center mb-10"
        >
          <motion.div variants={fadeIn} className="inline-flex items-center justify-center mb-6">
            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold tracking-widest uppercase border border-indigo-100 shadow-sm">
              #1 Mindfulness App in Sri Lanka
            </span>
          </motion.div>

          <motion.h1 variants={fadeIn} className="text-5xl sm:text-6xl font-extrabold text-slate-900 leading-[1.05] mb-6 tracking-tight">
            Find Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient-x">
              Inner Peace
            </span>
          </motion.h1>

          <motion.p variants={fadeIn} className="text-lg text-slate-600 leading-relaxed mx-auto mb-8">
            {t('home.hero.description')}
          </motion.p>

          {/* Mock App Preview Card - "Now Playing" style */}
          <motion.div
            variants={fadeIn}
            className="relative w-full aspect-[2/1] sm:aspect-[2.5/1] mb-10 mx-auto"
          >
            <div className="absolute inset-x-4 inset-y-0 bg-white/40 backdrop-blur-sm rounded-3xl transform rotate-[-3deg] scale-95 border border-white/30" />
            <div className="absolute inset-x-4 inset-y-0 bg-white/40 backdrop-blur-sm rounded-3xl transform rotate-[3deg] scale-95 border border-white/30" />

            {/* Main Card */}
            <div className="relative h-full bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-indigo-500/10 border border-white p-4 flex items-center gap-4 overflow-hidden">
              <div className="h-full aspect-square rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-inner relative overflow-hidden group cursor-pointer" onClick={togglePlay}>
                {/* Play/Pause Overlay */}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  {isPlaying ? (
                    <svg className="w-10 h-10 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                  ) : (
                    <svg className="w-10 h-10 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  )}
                </div>
              </div>
              <div className="flex-1 text-left min-w-0 flex flex-col justify-center">
                <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Featured Dhamma Talk
                </div>
                <div className="text-base sm:text-lg font-bold text-slate-900 truncate leading-tight mb-0.5">
                  භාවනාව බෞද්ධයන්ට පමණක් ද?
                </div>
                <div className="text-xs sm:text-sm text-slate-500 truncate font-medium">
                  Most Ven. Na Uyane Ariyadhamma Maha Thero
                </div>

                {/* Progress visual */}
                <div className="mt-3 w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: isPlaying ? "100%" : "30%" }}
                    transition={{ duration: isPlaying ? 30 : 0, ease: "linear" }}
                    className="h-full bg-amber-500 rounded-full"
                  />
                </div>
                <audio ref={audioRef} src={audioUrl || undefined} onEnded={() => setIsPlaying(false)} className="hidden" />
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeIn} className="flex flex-col gap-3 w-full">
            <Link
              href="/auth?mode=register"
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-indigo-500/30 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 group"
            >
              <span>{t('home.hero.start_journey')}</span>
              <svg className="w-5 h-5 text-indigo-100 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </motion.div>

        </motion.div>

        {/* Social Proof Strip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-4 mb-12"
        >
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 bg-cover bg-center`} style={{ backgroundColor: `hsl(${i * 60}, 70%, 90%)` }}>
                {/* Placeholder avatar colors */}
              </div>
            ))}
          </div>

          <div className="text-left">
            <div className="flex text-amber-400 text-xs">
              {'★★★★★'}
            </div>
            <p className="text-xs font-semibold text-slate-600">Loved by <span className="text-indigo-600">1,000+</span> people</p>
          </div>
        </motion.div>

        {/* Explore Topics - Horizontal Scroll */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <h3 className="text-sm font-bold text-slate-900 mb-3 px-1">Explore Topics</h3>
          <div className="flex overflow-x-auto pb-4 gap-3 -mx-6 px-6 scrollbar-hide snap-x">
            {topics.map((topic, i) => (
              <div key={i} className={`snap-start shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold ${topic.color} whitespace-nowrap`}>
                {topic.title}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Daily Wisdom Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <h3 className="text-sm font-bold text-slate-900 mb-3 px-1">Daily Wisdom</h3>
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white text-center shadow-lg relative overflow-hidden">

            {/* Decorative circles */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-900/20 rounded-full translate-x-1/2 translate-y-1/2 blur-2xl" />

            <svg className="w-8 h-8 text-white/40 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z" /></svg>

            <p className="text-lg font-medium leading-relaxed mb-4 relative z-10">
              "Peace comes from within. Do not seek it without."
            </p>
            <div className="text-xs font-bold uppercase tracking-widest text-indigo-200">Buddha</div>
          </div>
        </motion.div>

        {/* Floating Feature Cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="space-y-4"
        >
          {/* Feature 1 */}
          <motion.div variants={fadeIn} className="bg-white/60 backdrop-blur-xl p-5 rounded-3xl border border-white/50 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{t('home.features.smart_timer.title')}</h3>
                <p className="text-sm text-slate-500 leading-tight mt-1">Focus deeply with adaptive timers.</p>
              </div>
            </div>
          </motion.div>

          {/* Feature 2 */}
          <motion.div variants={fadeIn} className="bg-white/60 backdrop-blur-xl p-5 rounded-3xl border border-white/50 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{t('home.features.progress_tracking.title')}</h3>
                <p className="text-sm text-slate-500 leading-tight mt-1">Visualize your journey daily.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Footer Minimal */}
        <div className="mt-12 mb-6 text-center">
          <p className="text-xs text-slate-400 font-medium">
            © {new Date().getFullYear()} {APP_CONFIG.name}.
          </p>
        </div>

      </main>
    </div>
  );
}
