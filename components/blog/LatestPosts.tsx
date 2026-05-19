'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  date: string;
  readTime: string;
}

interface LatestPostsProps {
  posts: Post[];
  title: string;
}

export default function LatestPosts({ posts, title }: LatestPostsProps) {
  const t = useTranslations('blogPage');
  const locale = useLocale();
  const blogPostBase = t('routes.postBase') || '/blog';
  const resolveLink = (slug: string) =>
    `/${locale}${blogPostBase.startsWith('/') ? blogPostBase : `/${blogPostBase}`}/${slug}`;
  return (
    <section>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="font-dm-sans mb-8 text-[clamp(1.75rem,3vw,2.5rem)] font-bold text-[#1E1F21]"
      >
        {title}
      </motion.h2>

      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => {
          const BlogPostImage = ({ imageSrc, alt }: { imageSrc: string; alt: string }) => {
            const [imgSrc, setImgSrc] = useState(imageSrc || 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/blog/hosting-guide.webp');
            const fallbackImage = 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/blog/hosting-guide.webp';

            return (
              <img
                src={imgSrc}
                alt={alt}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={() => {
                  if (imgSrc !== fallbackImage) {
                    setImgSrc(fallbackImage);
                  }
                }}
              />
            );
          };

          return (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={resolveLink(post.slug)} className="group block">
                <div className="mb-4 overflow-hidden rounded-xl">
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                    <BlogPostImage 
                      imageSrc={post.image || 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/blog/hosting-guide.webp'} 
                      alt={post.title} 
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-medium tracking-wide text-[#8C52FF] uppercase">
                    {post.category}
                  </span>

                  <h3 className="font-dm-sans line-clamp-2 text-[clamp(1rem,1.5vw,1.125rem)] leading-snug font-semibold text-[#1E1F21] transition-colors duration-200 group-hover:text-[#8C52FF]">
                    {post.title}
                  </h3>

                  <p className="font-dm-sans line-clamp-2 text-[clamp(0.875rem,1.2vw,1rem)] leading-relaxed text-[#667085]">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center gap-2 pt-1 text-xs text-[#98A2B3]">
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </Link>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
