'use client';

import { useActionState, useEffect, useState } from 'react';
import * as React from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';
import { submitContactForm } from '@/actions/contact-actions';
import { toast } from 'sonner';
import DiscordTicketSuccess from '@/components/DiscordTicketSuccess';

export default function ContactForm() {
  const t = useTranslations('contact-page.form');
  const [state, action, isPending] = useActionState(submitContactForm, {
    success: false,
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (state.success && state.message) {
      setIsSubmitted(true);
      setSubmittedEmail(formData.email); // Save email before clearing
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
      setTimeout(() => {
        setIsSubmitted(false);
        setSubmittedEmail('');
      }, 500000); // Keep success state longer so they can click the button
    } else if (!state.success && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formDataObj = new FormData();
    formDataObj.append('firstName', formData.firstName);
    formDataObj.append('lastName', formData.lastName);
    formDataObj.append('email', formData.email);
    formDataObj.append('phone', formData.phone);
    formDataObj.append('subject', formData.subject);
    formDataObj.append('message', formData.message);

    React.startTransition(() => {
      action(formDataObj);
    });
  };

  const subjects = t.raw('subjects');

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="rounded-xl border border-gray-100 bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6 md:p-8 lg:p-10"
    >
      {isSubmitted ? (
        <DiscordTicketSuccess
          discordChannelUrl={state.discordChannelUrl}
          email={submittedEmail}
          onReset={() => setIsSubmitted(false)}
        />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 sm:space-y-5 md:space-y-6"
        >
          {/* Name Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="font-dm-sans mb-2 block text-sm font-semibold text-[#1E1F21]">
                {t('firstName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder={t('firstNamePlaceholder')}
                className={`font-dm-sans w-full rounded-xl border px-4 py-3.5 text-[#1E1F21] transition-all duration-200 placeholder:text-gray-400 focus:border-[#8C52FF] focus:ring-2 focus:ring-[#8C52FF]/20 focus:outline-none ${state.errors?.firstName ? 'border-red-500' : 'border-gray-200'}`}
              />
              {state.errors?.firstName && (
                <p className="mt-1 text-xs text-red-500">
                  {state.errors.firstName[0]}
                </p>
              )}
            </div>
            <div>
              <label className="font-dm-sans mb-2 block text-sm font-semibold text-[#1E1F21]">
                {t('lastName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder={t('lastNamePlaceholder')}
                className={`font-dm-sans w-full rounded-xl border px-4 py-3.5 text-[#1E1F21] transition-all duration-200 placeholder:text-gray-400 focus:border-[#8C52FF] focus:ring-2 focus:ring-[#8C52FF]/20 focus:outline-none ${state.errors?.lastName ? 'border-red-500' : 'border-gray-200'}`}
              />
              {state.errors?.lastName && (
                <p className="mt-1 text-xs text-red-500">
                  {state.errors.lastName[0]}
                </p>
              )}
            </div>
          </div>

          {/* Email & Phone Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="font-dm-sans mb-2 block text-sm font-semibold text-[#1E1F21]">
                {t('email')} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder={t('emailPlaceholder')}
                className={`font-dm-sans w-full rounded-xl border px-4 py-3.5 text-[#1E1F21] transition-all duration-200 placeholder:text-gray-400 focus:border-[#8C52FF] focus:ring-2 focus:ring-[#8C52FF]/20 focus:outline-none ${state.errors?.email ? 'border-red-500' : 'border-gray-200'}`}
              />
              {state.errors?.email && (
                <p className="mt-1 text-xs text-red-500">
                  {state.errors.email[0]}
                </p>
              )}
            </div>
            <div>
              <label className="font-dm-sans mb-2 block text-sm font-semibold text-[#1E1F21]">
                {t('phone')}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t('phonePlaceholder')}
                className="font-dm-sans w-full rounded-xl border border-gray-200 px-4 py-3.5 text-[#1E1F21] transition-all duration-200 placeholder:text-gray-400 focus:border-[#8C52FF] focus:ring-2 focus:ring-[#8C52FF]/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="font-dm-sans mb-2 block text-sm font-semibold text-[#1E1F21]">
              {t('subject')} <span className="text-red-500">*</span>
            </label>
            <select
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="font-dm-sans w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-[#1E1F21] transition-all duration-200 focus:border-[#8C52FF] focus:ring-2 focus:ring-[#8C52FF]/20 focus:outline-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.75rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem',
              }}
            >
              <option value="">{t('subjectPlaceholder')}</option>
              {subjects.map((subject: string, index: number) => (
                <option key={index} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="font-dm-sans mb-2 block text-sm font-semibold text-[#1E1F21]">
              {t('message')} <span className="text-red-500">*</span>
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={5}
              placeholder={t('messagePlaceholder')}
              className={`font-dm-sans w-full resize-none rounded-xl border px-4 py-3.5 text-[#1E1F21] transition-all duration-200 placeholder:text-gray-400 focus:border-[#8C52FF] focus:ring-2 focus:ring-[#8C52FF]/20 focus:outline-none ${state.errors?.message ? 'border-red-500' : 'border-gray-200'}`}
            />
            {state.errors?.message && (
              <p className="mt-1 text-xs text-red-500">
                {state.errors.message[0]}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending}
            className="font-dm-sans h-14 w-full rounded-xl bg-[#8C52FF] text-base font-semibold text-white shadow-lg shadow-[#8C52FF]/20 transition-all duration-300 hover:bg-[#7B42EE] hover:shadow-[#8C52FF]/30 disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t('sending')}
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                {t('submit')}
              </>
            )}
          </Button>
        </form>
      )}
    </motion.div>
  );
}
