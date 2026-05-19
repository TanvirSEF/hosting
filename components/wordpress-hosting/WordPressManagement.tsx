"use client";

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { CloudUpload, Headset } from 'lucide-react';

export default function WordPressManagement() {
    const t = useTranslations('wordpress-hosting.management');

    return (
        <section className="relative z-20 w-full overflow-visible bg-[#FAFAFA] py-[120px]">
            {/* Left Side Glow/Blob */}
            <div
                className="absolute w-[200px] lg:w-[300px] xl:w-[400px] h-[300px] md:h-[350px] lg:h-[450px] xl:h-[550px] -left-[100px] lg:-left-[150px] xl:-left-[200px] top-[150px] bg-[rgba(167,120,250,0.5)] opacity-60 blur-[60px] md:blur-[80px] rounded-full pointer-events-none z-0"
            />

            <div className="container relative z-10 w-full max-w-[1360px] 3xl:max-w-[1600px] mx-auto px-4 flex flex-col items-center gap-16">

                {/* Header */}
                <div className="flex flex-col items-center gap-4 text-center max-w-[768px]">
                    <h2 className="font-dm-sans font-bold text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.2] text-[#1E1F21]">
                        {t('heading')}
                    </h2>
                    <span className="font-dm-sans font-normal text-[clamp(1rem,1.5vw,1.125rem)] text-[#667085]">
                        {t('tagline')}
                    </span>
                </div>

                {/* Bento Grid */}
                <div className="w-full grid grid-cols-1 lg:grid-cols-[464px_1fr] gap-8">

                    {/* Left Column: Monitoring Card */}
                    <div className="group flex flex-col border border-[#DBD5D5] bg-white rounded-[20px] overflow-hidden shadow-sm h-full cursor-default hover:z-10 relative transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-[#8C52FF] hover:shadow-[0px_20px_40px_rgba(140,82,255,0.1)]">
                        <div className="p-8 flex flex-col gap-2">
                            <h3 className="font-dm-sans font-bold text-2xl text-[#1E1F21]">
                                {t('cards.monitoring.title')}
                            </h3>
                            <p className="font-roboto font-normal text-base text-[#667085]">
                                {t('cards.monitoring.description')}
                            </p>
                        </div>
                        <div className="mt-auto relative w-full h-[300px] sm:h-[400px] lg:h-[503px] bg-[#E3E3E3] overflow-hidden">
                            <div className="relative w-full h-full transition-transform duration-500 ease-out group-hover:scale-105">
                                <Image
                                    src="https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/wordpress-hosting/core-update.webp"
                                    alt="Monitoring Preview"
                                    fill
                                    className="object-cover object-top"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col gap-8 h-full">

                        {/* Top: Patch & Update */}
                        <div className="group flex flex-col md:flex-row border border-[#DBD5D5] bg-white rounded-[20px] overflow-hidden min-h-[380px] cursor-default hover:z-10 relative transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-[#8C52FF] hover:shadow-[0px_20px_40px_rgba(140,82,255,0.1)]">
                            <div className="p-8 flex flex-col justify-center gap-2 md:w-1/2">
                                <h3 className="font-dm-sans font-bold text-2xl text-[#1E1F21]">
                                    {t('cards.patch.title')}
                                </h3>
                                <p className="font-roboto font-normal text-base text-[#667085]">
                                    {t('cards.patch.description')}
                                </p>
                            </div>
                            <div className="relative w-full md:w-1/2 h-[300px] md:h-full bg-[#E3E3E3] overflow-hidden">
                                <div className="relative w-full h-full transition-transform duration-500 ease-out group-hover:scale-105">
                                    <Image
                                        src="https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/wordpress-hosting/backups.webp"
                                        alt="Patch and Update"
                                        fill
                                        className="object-cover object-center"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">

                            {/* Backups Card */}
                            <div className="group flex flex-col p-8 gap-6 border border-[#DBD5D5] bg-white rounded-[20px] min-h-[300px] justify-center cursor-default hover:z-10 relative transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-[#8C52FF] hover:shadow-[0px_20px_40px_rgba(140,82,255,0.1)]">
                                <div className="w-12 h-12 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                                    <CloudUpload className="w-8 h-8 text-[#8C52FF]" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h3 className="font-dm-sans font-bold text-2xl text-[#1E1F21]">
                                        {t('cards.backups.title')}
                                    </h3>
                                    <p className="font-roboto font-normal text-base text-[#667085]">
                                        {t('cards.backups.description')}
                                    </p>
                                </div>
                            </div>

                            {/* Support Card */}
                            <div className="group flex flex-col p-8 gap-6 border border-[#DBD5D5] bg-white rounded-[20px] min-h-[300px] justify-center cursor-default hover:z-10 relative transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-[#8C52FF] hover:shadow-[0px_20px_40px_rgba(140,82,255,0.1)]">
                                <div className="w-12 h-12 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                                    <Headset className="w-8 h-8 text-[#8C52FF]" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h3 className="font-dm-sans font-bold text-2xl text-[#1E1F21]">
                                        {t('cards.support.title')}
                                    </h3>
                                    <p className="font-roboto font-normal text-base text-[#667085]">
                                        {t('cards.support.description')}
                                    </p>
                                </div>
                            </div>

                        </div>

                    </div>

                </div>

            </div>
        </section>
    );
}
