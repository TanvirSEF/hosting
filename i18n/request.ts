import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  const homeMessages = (await import(`@/translations/home/${locale}.json`))
    .default;
  const vpsMessages = (await import(`@/translations/vps/${locale}.json`))
    .default;
  const sharedHostingMessages = (
    await import(`@/translations/shared-hosting/${locale}.json`)
  ).default;
  const wordpressHostingMessages = (
    await import(`@/translations/wordpress-hosting/${locale}.json`)
  ).default;
  const ecommerceHostingMessages = (
    await import(`@/translations/ecommerce-hosting/${locale}.json`)
  ).default;
  const domainSearchMessages = (
    await import(`@/translations/domain-search/${locale}.json`)
  ).default;
  const domainTransferMessages = (
    await import(`@/translations/domain-transfer/${locale}.json`)
  ).default;
  const privacyPolicyMessages = (
    await import(`@/translations/legal/privacy-policy/${locale}.json`)
  ).default;
  const termsOfServiceMessages = (
    await import(`@/translations/legal/terms-of-service/${locale}.json`)
  ).default;
  const cookiePolicyMessages = (
    await import(`@/translations/legal/cookie-policy/${locale}.json`)
  ).default;
  const blogMessages = (await import(`@/translations/blog/${locale}.json`))
    .default;
  const contactPageMessages = (
    await import(`@/translations/contact/${locale}.json`)
  ).default;
  const aboutMessages = (await import(`@/translations/about/${locale}.json`))
    .default;
  const footerMessages = (await import(`@/translations/footer/${locale}.json`))
    .default;
  const pricePhilosophyMessages = (await import(`@/translations/price-philosophy/${locale}.json`))
    .default;

  return {
    locale,
    messages: {
      ...homeMessages,
      pricePhilosophy: pricePhilosophyMessages,
      vps: vpsMessages,
      'shared-hosting': sharedHostingMessages,
      'wordpress-hosting': wordpressHostingMessages,
      'ecommerce-hosting': ecommerceHostingMessages,
      'domain-search': domainSearchMessages,
      'domain-transfer': domainTransferMessages,
      'privacy-policy': privacyPolicyMessages,
      'terms-of-service': termsOfServiceMessages,
      'cookie-policy': cookiePolicyMessages,
      blogPage: blogMessages,
      'contact-page': contactPageMessages,
      about: aboutMessages,
      webHosting: (
        await import(`@/translations/pricing/web-hosting/${locale}.json`)
      ).default,
      wordpressHosting: (
        await import(`@/translations/pricing/wordpress-hosting/${locale}.json`)
      ).default,
      vpsHosting: (
        await import(`@/translations/pricing/vps-hosting/${locale}.json`)
      ).default,
      domains: (await import(`@/translations/pricing/domains/${locale}.json`))
        .default,
      footer: footerMessages,
    },
  };
});
