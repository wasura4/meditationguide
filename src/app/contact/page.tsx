'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { APP_CONFIG } from '@/constants';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });

      setTimeout(() => setSubmitStatus('idle'), 5000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Navigation Header */}
      <nav className="glass sticky top-0 z-50">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="flex justify-between items-center h-[52px]">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[var(--primary)] rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-[21px] font-semibold text-[var(--foreground)]">
                {APP_CONFIG.name}
              </span>
            </Link>

            <div className="flex items-center space-x-6">
              <Link
                href="/"
                className="text-[14px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                Home
              </Link>
              <Link
                href="/auth"
                className="btn-apple btn-primary text-[14px]"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-[88px] pb-[64px] px-6 text-center fade-in">
        <h1 className="text-[56px] leading-[1.07] font-semibold text-[var(--foreground)] mb-4 tracking-tight">
          Get in Touch
        </h1>
        <p className="text-[21px] leading-[1.381] text-[var(--muted-foreground)] max-w-[640px] mx-auto">
          Have questions or feedback? We&apos;d love to hear from you.
        </p>
      </div>

      {/* Main Content */}
      <div className="py-16 px-6">
        <div className="max-w-[1120px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="card-elevated p-8 fade-in fade-in-delay-1">
              <h2 className="text-[28px] font-semibold text-[var(--foreground)] mb-6 tracking-tight">
                Send us a Message
              </h2>

              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-[var(--success)] bg-opacity-10 border border-[var(--success)] border-opacity-30 rounded-[var(--radius)]">
                  <div className="flex items-center text-[var(--success)]">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-[14px] font-medium">
                      Message sent successfully!
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className="block text-[13px] font-medium text-[var(--foreground)] mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-[var(--border)] rounded-[var(--radius)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--background)] text-[var(--foreground)] text-[15px] transition-all"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-[13px] font-medium text-[var(--foreground)] mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-[var(--border)] rounded-[var(--radius)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--background)] text-[var(--foreground)] text-[15px] transition-all"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-[13px] font-medium text-[var(--foreground)] mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-[var(--radius)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--background)] text-[var(--foreground)] text-[15px] transition-all"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="meditation">Meditation Guidance</option>
                    <option value="feedback">Feedback & Suggestions</option>
                    <option value="partnership">Partnership</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-[13px] font-medium text-[var(--foreground)] mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-[var(--radius)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--background)] text-[var(--foreground)] text-[15px] transition-all resize-none"
                    placeholder="How can we help you?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-apple btn-primary w-full text-[17px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-6 fade-in fade-in-delay-2">
              {/* Company Info */}
              <div className="bg-[var(--primary)] text-white rounded-[var(--radius-lg)] p-8">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-3xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-[24px] font-semibold mb-3 tracking-tight">About {APP_CONFIG.name}</h3>
                <p className="text-[15px] opacity-90 leading-[1.47] mb-6">
                  We&apos;re dedicated to making meditation accessible to everyone through modern technology and ancient wisdom.
                </p>
                <div className="flex items-center space-x-6">
                  <div>
                    <div className="text-[28px] font-semibold">10,000+</div>
                    <div className="text-[13px] opacity-80">Active Users</div>
                  </div>
                  <div>
                    <div className="text-[28px] font-semibold">24/7</div>
                    <div className="text-[13px] opacity-80">Support</div>
                  </div>
                </div>
              </div>

              {/* Contact Methods */}
              <div className="space-y-4">
                <h3 className="text-[21px] font-semibold text-[var(--foreground)] tracking-tight">
                  Other Ways to Reach Us
                </h3>

                <div className="card-elevated p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-[var(--primary)] bg-opacity-10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--foreground)] text-[15px] mb-1">Email Support</h4>
                      <p className="text-[14px] text-[var(--muted-foreground)]">support@meditationguide.com</p>
                      <p className="text-[12px] text-[var(--muted-foreground)] mt-1">Response within 24 hours</p>
                    </div>
                  </div>
                </div>

                <div className="card-elevated p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-[var(--success)] bg-opacity-10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--foreground)] text-[15px] mb-1">Help Center</h4>
                      <p className="text-[14px] text-[var(--muted-foreground)]">Browse our guides</p>
                      <Link href="/help" className="text-[var(--primary)] hover:underline text-[13px] mt-1 inline-block">
                        Visit Help Center →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[var(--muted)] py-12 px-6 mt-16">
        <div className="max-w-[1120px] mx-auto text-center">
          <p className="text-[12px] text-[var(--muted-foreground)]">
            © {new Date().getFullYear()} {APP_CONFIG.name}. Created by {APP_CONFIG.author}.
          </p>
          <p className="text-[12px] text-[var(--muted-foreground)] mt-2">
            May all beings be happy and peaceful.
          </p>
        </div>
      </footer>
    </div>
  );
}
