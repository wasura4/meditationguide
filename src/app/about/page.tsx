'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ArrowLeft, Heart } from 'lucide-react';

export default function AboutPage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 h-16">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold">About Us</h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20 p-8 mb-8 text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <Heart className="w-16 h-16 text-primary" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                තෙරුවන් සරණයි සියලුදෙනාටම
              </h2>
            </div>
          </div>

          {/* Content Section */}
          <div className="bg-card rounded-2xl p-8 shadow-sm border space-y-6">
            <div className="prose prose-lg max-w-none">
              <div className="text-foreground leading-relaxed space-y-6" style={{ fontSize: '1.125rem', lineHeight: '1.8' }}>
                <p>
                  දෙවියන් සහිත ලෝකයාට ලොවී ලොවුතුරා සුවය සලසන්නා වු, සසරගත සත්වයින් සංසාරයෙන් මුදවන්නා වු, තුන් ලොවට අසහාය නායක වු තුන්ලෝක වාසීන්ගේ පරම පුජනීය වු, අංගීරස ඇති තුන් ලොවට භාග්‍යවත් වු සම්මා සම්බුදුරජාණන් වහන්සේට නමස්කාර වේවා!
                </p>

                <p>
                  දැනට අවුරුදු කිහිපයකට පෙර අප විසින් සකස් කරන ලද පළමු භාවනා මෙවලම යෝගවචරයින් 5000 අධික පිරිසක් නිතර ප්‍රයෝජනයට අරගත් බව අපි බොහොම මෙත් සිතින් සතුටු වෙමු.  නවතම තාක්ෂණය සමඟ ඔබට දුර්ලභ භාවනාව කර්මස්ථාන සහ භාවනාව ඔබ සමීපයටම ගෙන එන්න අපගේ මේ භාවනා කරමු App එකෙන් අපි බලාපොරොත්තු වෙනවා.
                </p>

                <p>
                  මෙහි එන සමසතලිස් කර්මස්ථාන දේශනා නා උයන අරණ්‍ය සේනාසනයේ සේනාසනාධිපති අතිපූජනීය මහාකම්මට්ඨානාචාර්ය අඟුල්ගමුවේ අරියනන්දාභිධාන මහා ස්ථවිර මා හිමිපාණන් වහන්සේ විසින් සිදු කර ඇත. ඒවගේම අති පුජ්‍ය, අග්ගමහා  මහාකම්මට්ඨානාචාර්ය ත්‍රිපිටක විශාරද නා උයන අරියධම්මාභිධාන මාහිමපානන් වහන්සේ විසින් ද අපවත් වී වදාළ ප්‍රධානමහාකම්මට්ඨානාචාර්ය අති පුජනීය රාජකීය පණ්ඩිත මාතර සිරි ඤාණාරාමාභිධාන මහෝපාධ්‍ය මාහිමිපාණන් වහන්සේගේ දුර්ලභ වූ යෝගවචරයන්ටම විශේෂ වූ දේශනා උපදෙස් මෙයට එකතු කර ඇත. තවත නිරතුරුවම භාවනාවට අදාළ සියලු උපදෙස් සහ ගැටළු සාකච්චා එකතු කරනු ඇත.
                </p>

                <p>
                  විශේෂයෙන්ම නා උයන අරණ්‍යයේ වැඩ සිටින එක් පින්වත් ස්වාමින්වහන්සේ නමක් මෙම කර්මස්ථාන දේශනා අප වෙත මෙත් සිතින් යුතුව ලබා දී සිදු කරගත් අප්‍රමාණ වූ කුසලය උන්වහන්සේටද නා උයන වැඩ සිට ගුණ දම් පුරන සියලුම ස්වාමිනව්හන්සේලා හටද ගිහි යෝගවචරයින්ටද  පතන්නාවූ බෝධියෙන් උතුම් නිර්වාණයට පැමිණෙත්වායි නිරතුරුව සිහි කරමු! අප සැමට නිරතුරුවම උපදෙස් ලබාදෙන පූජ්‍ය ආටිගල විපස්සී ස්වාමින්වහන්සේ හටත් මෙම ධර්ම දානය උන්වහන්සේ පතන්නාවූ උතුම් බෝධියට මෙම කුසලය හේතු වේවායි පතමි.
                </p>

                <p>
                  සද්ධම් ආර්ය පදනමේ වෛද්‍ය ගයාන් ජයවර්ධන, මනිඳු සිල්වා ඇතුළු පිරිසකගේ දායකත්වය ලබා දීම තුලින් මෙවර iOS පද්ධතියටත් නිකුත් කිරීමට හැකිවිය. සද්ධම් ආර්ය පදනමේ සියලු දෙනාටමද මෙම මහා ධර්ම දානමය කුසලය අනුමෝදන් කරමි.
                </p>

                <p>
                  තාක්ෂණික දැනුම උපයෝගී කරගෙන සියලුම සැකසුම් මා විසින් කරන ලදි. විවිධ සේවා වලට යන වියදම් සියල්ල දරාගෙන ප්‍රයෝජනය කරන සියල්ලන්ටම නොමිලේ කිසිඳු දායක මුදලක්වත් නොගෙන දීමට අප විසින් තීරණය කළෙමු. මගේ පවුලේ සියලු දෙනාටද මේ උතුම් කුසලය අනුමෝදන් කරමි. සියලු දෙනාටම සසර නිවී සැනසෙන්න මේ කුසලය හේතු වේවා.
                </p>

                <p>
                  ඝෝර සසරින් එතෙර වන්නට, උතුම් මඟ පල පසක් කරන්නට දිවා රෑ වීර්ය වඩන්නා වූ යෝගාවචරයන්හට මෙය නිවන පිණිසම රැගෙන යන්නට හේතු වේවා! තෙරුවන් සරණයි.
                </p>

                <div className="mt-8 pt-6 border-t border-border">
                  <p className="text-center font-semibold text-primary">
                    මෙත් සිතින් යුතුව<br />
                    වාසුර එදිරිසුරිය විසින් සකස් කරන ලදී.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom spacing */}
          <div className="pb-24" />
        </main>
      </div>
    </ProtectedRoute>
  );
}
