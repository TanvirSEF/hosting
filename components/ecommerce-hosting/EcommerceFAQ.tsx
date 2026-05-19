'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function EcommerceFAQ() {
  const t = useTranslations('ecommerce-hosting.faq');
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <section className="relative flex w-full items-center justify-center overflow-hidden bg-[#FAFAFA] px-4 py-[120px] md:px-10">
      <div className="pointer-events-none absolute right-0 bottom-0 -mr-[100px] -mb-[100px] h-[500px] w-[280px] rotate-[8.31deg] bg-[rgba(167,120,250,0.5)] opacity-60 blur-[80px]" />

      <div className="relative z-10 flex w-full max-w-[896px] flex-col items-center gap-16">
        <h2 className="font-dm-sans text-center text-[clamp(1.75rem,3vw,2.5rem)] leading-[52px] font-bold text-[#1E1F21]">
          {t('heading')}
        </h2>

        <div className="flex w-full flex-col gap-3 md:gap-6">
          {t.raw('questions').map((faq: any, index: number) => (
            <details
              key={index}
              className="group w-full rounded-[20px] border border-[#EAECF0] bg-white"
              open={openIndex === index}
            >
              <summary
                onClick={(e) => {
                  e.preventDefault();
                  setOpenIndex(openIndex === index ? -1 : index);
                }}
                className="flex w-full cursor-pointer list-none items-center justify-between gap-6 p-5 text-left transition-colors duration-200 hover:bg-gray-50 md:p-6 [&::-webkit-details-marker]:hidden"
              >
                <span className="font-dm-sans flex-1 text-[clamp(1rem,1.8vw,1.25rem)] leading-[150%] font-semibold text-[#4A4C51]">
                  {faq.question}
                </span>
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center transition-transform duration-200 ease-out group-open:rotate-45">
                  <Plus className="h-5 w-5 stroke-[2.5] text-[#8C52FF]" />
                </div>
              </summary>
              <div className="px-5 pb-6 md:px-6">
                <p
                  className="font-dm-sans text-[clamp(1rem,1.5vw,1.125rem)] leading-[150%] font-normal text-[#667085]"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
