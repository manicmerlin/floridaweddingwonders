'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { SITE_CONFIG } from '@/lib/seo';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  inquiryType: 'general' | 'venue-listing' | 'claim-support' | 'technical' | 'partnership';
}

export default function Contact() {
  const t = useTranslations('ContactPage');
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    inquiryType: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      console.log('Contact form submitted:', formData);
      setSubmitted(true);
      setIsSubmitting(false);
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('successTitle')}</h2>
            <p className="text-gray-600 mb-6">{t('successBody')}</p>
            <Link
              href="/venues"
              className="inline-block bg-pink-600 text-white py-2 px-6 rounded-md hover:bg-pink-700 transition"
            >
              {t('successCta')}
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('title')}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t('subtitle')}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('getInTouch')}</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-pink-600 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">{t('emailHeading')}</p>
                    <a href={`mailto:${SITE_CONFIG.email}`} className="text-gray-600 hover:text-pink-600">
                      {SITE_CONFIG.email}
                    </a>
                  </div>
                </div>

                {SITE_CONFIG.phone && (
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-pink-600 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">{t('phoneHeading')}</p>
                      <a href={`tel:${SITE_CONFIG.phone.replace(/[^+\d]/g, '')}`} className="text-gray-600 hover:text-pink-600">
                        {SITE_CONFIG.phone}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start">
                  <svg className="w-6 h-6 text-pink-600 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">{t('hoursHeading')}</p>
                    <p className="text-gray-600">{t('hoursValue')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('quickLinksHeading')}</h3>
              <div className="space-y-3">
                <Link href="/venues" className="block text-pink-600 hover:text-pink-700 transition">
                  {t('quickLinkBrowse')}
                </Link>
                <a href="mailto:venues@floridaweddingwonders.com" className="block text-pink-600 hover:text-pink-700 transition">
                  {t('quickLinkListVenue')}
                </a>
                <a href="mailto:claims@floridaweddingwonders.com" className="block text-pink-600 hover:text-pink-700 transition">
                  {t('quickLinkClaim')}
                </a>
                <a href="mailto:support@floridaweddingwonders.com" className="block text-pink-600 hover:text-pink-700 transition">
                  {t('quickLinkTechSupport')}
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('sendMessage')}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('fullNameRequired')}
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder={t('fullNamePlaceholder')}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('emailRequired')}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder={t('emailPlaceholder')}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('phoneLabel')}
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder={t('phonePlaceholder')}
                    />
                  </div>

                  <div>
                    <label htmlFor="inquiryType" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('inquiryTypeRequired')}
                    </label>
                    <select
                      id="inquiryType"
                      name="inquiryType"
                      required
                      value={formData.inquiryType}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="general">{t('inquiryGeneral')}</option>
                      <option value="venue-listing">{t('inquiryListVenue')}</option>
                      <option value="claim-support">{t('inquiryClaim')}</option>
                      <option value="technical">{t('inquiryTechnical')}</option>
                      <option value="partnership">{t('inquiryPartnership')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('subjectRequired')}
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                    placeholder={t('subjectPlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('messageRequired')}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                    placeholder={t('messagePlaceholder')}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-pink-600 text-white px-8 py-3 rounded-md font-medium hover:bg-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? t('sending') : t('sendButton')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('faqTitle')}</h2>
            <p className="text-gray-600">{t('faqSubtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-2">{t('faqListTitle')}</h3>
              <p className="text-gray-600 text-sm">{t('faqListBody')}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-2">{t('faqCostTitle')}</h3>
              <p className="text-gray-600 text-sm">{t('faqCostBody')}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-2">{t('faqClaimTitle')}</h3>
              <p className="text-gray-600 text-sm">{t('faqClaimBody')}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-2">{t('faqUpdateTitle')}</h3>
              <p className="text-gray-600 text-sm">{t('faqUpdateBody')}</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
