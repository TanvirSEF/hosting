'use client';

import { useState } from 'react';
import { CheckCircle, Copy, Check, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';

const DISCORD_INVITE = process.env.NEXT_PUBLIC_DISCORD_INVITE || 'https://discord.gg/webblyhosting';

function DiscordLogo({ size = 18 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
        >
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
        </svg>
    );
}

interface Props {
    discordChannelUrl?: string;
    email?: string;
    onReset?: () => void;
}

export default function DiscordTicketSuccess({ discordChannelUrl, email, onReset }: Props) {
    const [copied, setCopied] = useState(false);
    const t = useTranslations('discordTicketSuccess');

    const handleCopy = () => {
        if (!discordChannelUrl) return;
        navigator.clipboard.writeText(discordChannelUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex w-full flex-col items-center gap-5 py-4 text-center sm:py-6">

            {/* Success indicator */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 ring-4 ring-emerald-100 sm:h-14 sm:w-14">
                <CheckCircle className="h-6 w-6 text-emerald-600 sm:h-7 sm:w-7" />
            </div>

            <div className="space-y-1">
                <h3 className="font-dm-sans text-base font-bold text-[#1E1F21] sm:text-lg">
                    {t('title')}
                </h3>
                <p className="text-sm text-[#667085]">
                    {t('subtitle')}
                </p>
            </div>

            {/* Steps card */}
            <div className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left sm:p-5">

                {/* Single Step: Connect & View */}
                <div className="text-center">
                    <div className="mb-2">
                        <span className="text-sm font-semibold text-[#1E1F21]">
                            {t('connectTitle')}
                        </span>
                    </div>
                    <p className="mb-4 text-xs text-[#667085]">
                        {t('connectDescription')}
                    </p>

                    <a
                        href={`/api/oauth/discord?email=${encodeURIComponent(email || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#4752C4] active:scale-[0.98] shadow-lg shadow-[#5865F2]/20"
                    >
                        <DiscordLogo size={20} />
                        {t('connectButtonText')}
                    </a>

                    <p className="mt-3 text-[10px] text-gray-400">
                        {t('connectFooter')}
                    </p>
                </div>
            </div>

            {onReset && (
                <button
                    type="button"
                    onClick={onReset}
                    className="text-sm text-[#8C52FF] underline underline-offset-2 transition-colors hover:text-[#7B42EE]"
                >
                    {t('sendAnother')}
                </button>
            )}
        </div>
    );
}

