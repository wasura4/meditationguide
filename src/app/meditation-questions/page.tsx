'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Send, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MeditationQuestionsPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    meditationType: '',
    question: '',
    contact: '',
  });

  const totalSteps = 5;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/send-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send question');
      }

      // Move to thank you step
      setStep(5);
    } catch (error) {
      console.error('Error sending question:', error);
      alert('දෝෂයක් ඇතිවිය. කරුණාකර නැවත උත්සාහ කරන්න.');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return true; // Welcome step, no validation
      case 2:
        return formData.name.trim().length > 0;
      case 3:
        return formData.meditationType.trim().length > 0;
      case 4:
        return formData.question.trim().length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`w-full h-2 rounded-full mx-1 transition-all ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            පියවර {step} / {totalSteps}
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-8 md:p-10">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="text-center space-y-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  තෙරුවන් සරණයි ඔබට!
                </h1>
                <div className="space-y-3 text-base sm:text-lg text-muted-foreground leading-relaxed">
                  <p>පළමුවෙන්ම බොහොම පින් අපගේ App එක භාවිතා කිරීම.</p>
                  <p className="font-medium text-foreground">
                    මම ඔබගේ භාවනා ගැටලුව උතුම් කමටහන් ගුරුවරයෙක් වෙත යොමු කරන්න උදවු කරන්නම්.
                  </p>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2 text-base font-medium shadow-lg hover:shadow-xl"
                >
                  ආරම්භ කරන්න
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Name */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="text-center space-y-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                  මට කියන්න ඔබගේ නම?
                </h2>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="ඔබගේ නම ඇතුළත් කරන්න"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  ආපසු
                </button>
                <button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ඊළඟ
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Meditation Type */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="text-center space-y-4">
                <p className="text-lg text-primary font-medium">ස්තුතියි {formData.name}!</p>
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                  මට කියන්න පුලුවන්ද ඔබ පුරුදු කරන භාවනාව කුමක්ද කියලා?
                </h2>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={formData.meditationType}
                  onChange={(e) =>
                    setFormData({ ...formData, meditationType: e.target.value })
                  }
                  placeholder="උදා: ආනාපානසති, මෛත්‍රී භාවනාව"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  ආපසු
                </button>
                <button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ඊළඟ
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Question */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="text-center space-y-4">
                <p className="text-lg text-primary font-medium">සාධු සාධු සාධු!</p>
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                  එහෙනම් ඔබගේ භාවනා ගැටලුව සදහන් කරන්න.
                </h2>
              </div>

              <div className="space-y-3">
                <textarea
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  placeholder="ඔබගේ ප්‍රශ්නය හෝ ගැටලුව විස්තරාත්මකව ලියන්න..."
                  rows={6}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base resize-none"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  ආපසු
                </button>
                <button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ඊළඟ
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Contact Info & Submit */}
          {step === 5 && !loading && formData.contact === '' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="text-center space-y-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground leading-relaxed">
                  අප ඔබගේ ගැටලුව සඳහන් කරගත්තා. මෙය කමටහන් ගුරුවරයකුට ඉදිරිපත් කර පිළිතුරක් ඔබ වෙතට එවන්නම්.
                </h2>
                <p className="text-base text-muted-foreground">
                  අප එය එවිය යුතු WhatsApp අංකය හෝ Email Address එක ලබා දෙන්න.
                </p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) =>
                    setFormData({ ...formData, contact: e.target.value })
                  }
                  placeholder="WhatsApp අංකය හෝ Email"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  ආපසු
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={formData.contact.trim().length === 0}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  යවන්න
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in duration-300">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-lg text-muted-foreground">යවමින් පවතී...</p>
            </div>
          )}

          {/* Thank You Message */}
          {step === 5 && !loading && formData.contact !== '' && (
            <div className="space-y-6 text-center animate-in fade-in duration-300">
              <div className="space-y-4">
                <div className="text-6xl mb-4">🙏</div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  බොහොම පිං
                </h2>
                <div className="space-y-3 text-base sm:text-lg text-muted-foreground leading-relaxed">
                  <p className="text-xl font-medium text-primary">ඔබට තෙරුවන් සරණයි!</p>
                  <p>භාවනාව දියුණු වේවා!</p>
                  <p className="font-semibold text-foreground">උතුම් නිවනම අරමුණු වේවා!</p>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-8 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-all text-base font-medium"
                >
                  මුල් පිටුවට යන්න
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
