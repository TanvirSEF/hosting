'use client';

import * as React from 'react';
import { useActionState, useEffect } from 'react';
import { Button } from './ui/button';
import { useTranslations } from 'next-intl';
import { submitContactForm } from '@/actions/contact-actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import DiscordTicketSuccess from './DiscordTicketSuccess';

export default function ContactForm({
  namespace = 'contactForm',
}: {
  namespace?: string;
} = {}) {
  const t = useTranslations(namespace);
  const [state, action, isPending] = useActionState(submitContactForm, {
    success: false,
    message: '',
  });

  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    message: '',
  });
  const [discordUrl, setDiscordUrl] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);
  const [submittedEmail, setSubmittedEmail] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-resize textarea
    if (name === 'message' && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      const maxHeight = 200;
      if (textarea.scrollHeight <= maxHeight) {
        textarea.style.height = `${textarea.scrollHeight}px`;
      } else {
        textarea.style.height = `${maxHeight}px`;
      }
    }
  };

  useEffect(() => {
    if (state.success && state.message) {
      setDiscordUrl(state.discordChannelUrl ?? null);
      setSubmitted(true);
      setSubmittedEmail(formData.email);
      setFormData({ firstName: '', lastName: '', email: '', message: '' });
      // Only auto-reset if no Discord URL — user needs time to click/copy
      if (!state.discordChannelUrl) {
        setTimeout(() => {
          setSubmitted(false);
          setSubmittedEmail('');
        }, 500000);
      }
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
    formDataObj.append('message', formData.message);

    React.startTransition(() => {
      action(formDataObj);
    });
  };

  if (submitted) {
    return (
      <DiscordTicketSuccess
        discordChannelUrl={discordUrl ?? undefined}
        email={submittedEmail}
        onReset={() => { setSubmitted(false); setDiscordUrl(null); setSubmittedEmail(''); }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="space-y-6">
        {/* Name Fields */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            {t('nameLabel')}
            <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder={t('firstNamePlaceholder')}
              required
              className={`w-full rounded-lg border px-4 py-3 transition-colors focus:border-transparent focus:ring-2 focus:ring-[#8C52FF] focus:outline-none ${state.errors?.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {state.errors?.firstName && (
              <p className="mt-1 text-xs text-red-500">
                {state.errors.firstName[0]}
              </p>
            )}
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder={t('lastNamePlaceholder')}
              required
              className={`w-full rounded-lg border px-4 py-3 transition-colors focus:border-transparent focus:ring-2 focus:ring-[#8C52FF] focus:outline-none ${state.errors?.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {state.errors?.lastName && (
              <p className="mt-1 text-xs text-red-500">
                {state.errors.lastName[0]}
              </p>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            {t('emailLabel')}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={t('emailPlaceholder')}
            required
            className={`w-full rounded-lg border px-4 py-3 transition-colors focus:border-transparent focus:ring-2 focus:ring-[#8C52FF] focus:outline-none ${state.errors?.email ? 'border-red-500' : 'border-gray-300'
              }`}
          />
          {state.errors?.email && (
            <p className="mt-1 text-xs text-red-500">{state.errors.email[0]}</p>
          )}
        </div>

        {/* Message Field */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            {t('messageLabel')}
            <span className="text-red-500">*</span>
          </label>
          <textarea
            ref={textareaRef}
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder={t('messagePlaceholder')}
            required
            rows={3}
            style={{ minHeight: '80px', maxHeight: '200px' }}
            className={`custom-scrollbar w-full resize-none overflow-y-auto rounded-lg border px-4 py-3 transition-colors focus:border-transparent focus:ring-2 focus:ring-[#8C52FF] focus:outline-none ${state.errors?.message ? 'border-red-500' : 'border-gray-300'
              }`}
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
          className="font-dm-sans h-[45px] w-full rounded-full bg-[#8C52FF] px-6 text-[16px] font-semibold text-white transition-all duration-300 hover:bg-[#7b42ff] hover:shadow-[0_4px_15px_rgba(140,82,255,0.35)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('sending')}
            </span>
          ) : (
            t('submitButton')
          )}
        </Button>
      </div>
    </form>
  );
}
