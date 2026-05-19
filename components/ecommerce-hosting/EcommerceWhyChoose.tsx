"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { cn } from "@/lib/utils";

export default function EcommerceWhyChoose() {
    const t = useTranslations('ecommerce-hosting.whyChoose');
    const [activeTab, setActiveTab] = useState<'support' | 'privacy' | 'pricing'>('support');

    const tabs = [
        { id: 'support', label: t('tabs.support.title'), description: t('tabs.support.description') },
        { id: 'privacy', label: t('tabs.privacy.title'), description: t('tabs.privacy.description') },
        { id: 'pricing', label: t('tabs.pricing.title'), description: t('tabs.pricing.description') },
    ] as const;

    return (
        <section className="relative w-full py-[120px] bg-[#FAFAFA] overflow-hidden block clear-both min-h-0">
            {/* Left Side Glow/Blob */}
            <div
                className="absolute w-[300px] md:w-[500px] lg:w-[600px] h-[300px] md:h-[500px] lg:h-[600px] -left-[150px] md:-left-[250px] top-[40%] bg-[rgba(167,120,250,0.5)] opacity-60 blur-[80px] rounded-full pointer-events-none z-0"
            />

            <div className="container relative z-10 w-full max-w-[1360px] mx-auto px-4 flex flex-col items-center gap-16">

                {/* Header */}
                <div className="flex flex-col items-center gap-4 text-center max-w-[768px]">
                    <h2 className="font-dm-sans font-bold text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.2] text-[#1E1F21]">
                        {t('heading')}
                    </h2>
                    <span className="font-dm-sans font-normal text-[clamp(1rem,1.5vw,1.125rem)] text-[#667085]">
                        {t('tagline')}
                    </span>
                </div>

                {/* Content Area */}
                <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-20 w-full">

                    {/* Left: Image Area */}
                    <div className="w-[300px] h-[300px] lg:w-[400px] lg:h-[400px] flex-none relative rounded-[20px] overflow-hidden bg-[#E3E3E3] shadow-sm">
                        <div className="relative w-full h-full">
                            <Image
                                src={`https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/ecommerce-hosting/tab-${activeTab}.webp`}
                                alt={t(`tabs.${activeTab}.title`)}
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>

                    {/* Right: Tabs Menu */}
                    <div className="flex flex-col w-full lg:w-flex-1 gap-4">
                        {tabs.map((tab) => (
                            <div
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "relative flex flex-col p-8 cursor-pointer transition-all duration-300 rounded-[20px] border-l-4",
                                    activeTab === tab.id
                                        ? "bg-white shadow-[0px_10px_30px_rgba(0,0,0,0.05)] border-[#8C52FF]/40"
                                        : "bg-transparent hover:bg-black/[0.02] border-transparent"
                                )}
                            >
                                <h3 className={cn(
                                    "font-dm-sans font-bold text-2xl transition-colors duration-300",
                                    activeTab === tab.id ? "text-[#1E1F21]" : "text-[#1E1F21]/60"
                                )}>
                                    {tab.label}
                                </h3>

                                <div
                                    className={cn(
                                        "grid transition-[grid-template-rows,margin] duration-300 ease-in-out",
                                        activeTab === tab.id ? "grid-rows-[1fr] mt-4 opacity-100" : "grid-rows-[0fr] mt-0 opacity-0"
                                    )}
                                >
                                    <div className="overflow-hidden">
                                        <p className="font-roboto font-normal text-base text-[#667085] leading-[1.5]">
                                            {tab.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>

            </div>
        </section>
    );
}
