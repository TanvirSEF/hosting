'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  date: string;
  readTime: string;
}

interface FeaturedGridProps {
  posts: Post[];
}

export default function FeaturedGrid({ posts }: FeaturedGridProps) {
  const t = useTranslations('blogPage');
  const locale = useLocale();
  const blogPostBase = t('routes.postBase') || '/blog';
  const resolveLink = (slug: string) =>
    `/${locale}${blogPostBase.startsWith('/') ? blogPostBase : `/${blogPostBase}`}/${slug}`;
  if (posts.length === 0) return null;

  const [main, ...side] = posts;
  const sidePosts = side.slice(0, 3);

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
      {/* Main Featured Post - Left */}
      {main && (
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href={resolveLink(main.slug)} className="group block">
            <div className="mb-5 overflow-hidden rounded-2xl">
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={main.image}
                  alt={main.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </div>

            <div className="space-y-3">
              <span className="inline-block text-xs font-medium tracking-wide text-[#8C52FF] uppercase">
                {main.category}
              </span>

              <h2 className="font-dm-sans text-[clamp(1.25rem,2vw,1.5rem)] leading-tight font-bold text-[#1E1F21] transition-colors duration-200 group-hover:text-[#8C52FF]">
                {main.title}
              </h2>

              <p className="font-dm-sans line-clamp-2 text-[clamp(1rem,1.5vw,1.125rem)] leading-relaxed text-[#667085]">
                {main.excerpt}
              </p>

              <div className="flex items-center gap-3 pt-1 text-sm text-[#98A2B3]">
                <span>{main.date}</span>
                <span>•</span>
                <span>{main.readTime}</span>
              </div>
            </div>
          </Link>
        </motion.article>
      )}

      {/* Side Posts - Right */}
      <div className="space-y-6">
        {sidePosts.map((post, index) => (
          <motion.article
            key={post.slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: (index + 1) * 0.1 }}
          >
            <Link
              href={resolveLink(post.slug)}
              className="group grid grid-cols-[140px_1fr] gap-4 sm:grid-cols-[180px_1fr]"
            >
              <div className="overflow-hidden rounded-xl">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-center space-y-2">
                <span className="text-xs font-medium tracking-wide text-[#8C52FF] uppercase">
                  {post.category}
                </span>

                <h3 className="font-dm-sans line-clamp-2 text-[clamp(1rem,1.5vw,1.125rem)] leading-snug font-semibold text-[#1E1F21] transition-colors duration-200 group-hover:text-[#8C52FF]">
                  {post.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-[#98A2B3]">
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </Link>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
