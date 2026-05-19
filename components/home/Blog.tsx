'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: {
    url: string;
    alt?: string;
  };
  category: string;
  publishedAt?: string;
}

export default function Blog() {
  const t = useTranslations();
  const locale = useLocale();
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlogPosts() {
      try {
        const response = await fetch(`/api/blog/posts?locale=${locale}&limit=5`);
        const data = await response.json();

        if (data.success && data.posts) {
          const posts = data.posts;
          // First post is the large featured card
          // Next 2 posts are the smaller featured cards
          // Remaining posts go to recent
          setFeaturedPosts(posts.slice(0, 3));
          setRecentPosts(posts.slice(3));
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    }

    fetchBlogPosts();
  }, [locale]);

  const getImageUrl = (post: BlogPost) => {
    return post.featuredImage?.url || '/images/blog/hosting-guide.png';
  };

  return (
    <section className="relative w-full bg-[#FAFAFA] py-[120px]">
      <div className="container mx-auto flex max-w-[1360px] flex-col gap-[64px] px-4 md:px-8">
        <div className="mx-auto flex max-w-[795px] flex-col items-center gap-6 text-center">
          <h2 className="font-dm-sans text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.3] font-bold text-[#1E1F21] capitalize">
            {t('blog.heading')}
          </h2>
          <p className="font-dm-sans max-w-[665px] text-[clamp(1rem,1.5vw,1.125rem)] leading-[1.5] text-[#667085]">
            {t('blog.subheading')}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#8C52FF]"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-[30px]">
            {featuredPosts.length > 0 && (
              <div className="grid grid-cols-1 gap-[30px] lg:grid-cols-12">
                {featuredPosts.map((post, index) =>
                  index === 0 ? (
                    <Link
                      key={post._id}
                      href={`/${locale}/blog/${post.slug}`}
                      className="group relative h-[470px] cursor-pointer overflow-hidden rounded-[20px] shadow-[0px_4px_35px_rgba(0,0,0,0.09)] transition-all duration-300 hover:shadow-[0px_10px_50px_rgba(0,0,0,0.15)] lg:col-span-7"
                    >
                      <Image
                        src={getImageUrl(post)}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      <div className="absolute bottom-0 left-0 flex w-full flex-col gap-2 rounded-b-[20px] border-t border-white/10 bg-white/10 p-4 backdrop-blur-[12px] transition-all duration-300 group-hover:bg-white/20 md:p-6">
                        <h3 className="font-dm-sans text-[clamp(1.25rem,2vw,1.5rem)] leading-tight font-semibold text-white capitalize">
                          {post.title}
                        </h3>
                        <p className="font-dm-sans text-[clamp(0.875rem,1.5vw,1.125rem)] leading-[1.5] font-normal text-white opacity-90">
                          {post.excerpt}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <Link
                      key={post._id}
                      href={`/${locale}/blog/${post.slug}`}
                      className="group flex cursor-pointer flex-col overflow-hidden rounded-[20px] border border-transparent bg-white shadow-[0px_4px_35px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#8C52FF]/20 hover:shadow-[0px_20px_50px_rgba(140,82,255,0.15)] lg:col-span-5"
                    >
                      <div className="relative h-[240px] w-full overflow-hidden md:h-[326px]">
                        <Image
                          src={getImageUrl(post)}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute top-4 right-4 z-10 translate-y-2 rounded-full bg-white/90 p-2 opacity-0 shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          <ArrowUpRight className="h-5 w-5 text-[#8C52FF]" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 p-4 md:p-6">
                        <h3 className="font-dm-sans text-[clamp(1.25rem,2vw,1.5rem)] leading-tight font-semibold text-[#1E1F21] capitalize transition-colors group-hover:text-[#8C52FF]">
                          {post.title}
                        </h3>
                        <p className="font-dm-sans line-clamp-2 text-[clamp(0.875rem,1.5vw,1.125rem)] leading-[1.5] font-normal text-[#667085]">
                          {post.excerpt}
                        </p>
                      </div>
                    </Link>
                  )
                )}
              </div>
            )}

            {recentPosts.length > 0 && (
              <div className="grid grid-cols-1 gap-[30px] md:grid-cols-2 lg:grid-cols-3">
                {recentPosts.map((post) => (
                  <Link
                    key={post._id}
                    href={`/${locale}/blog/${post.slug}`}
                    className="group flex cursor-pointer flex-col overflow-hidden rounded-[20px] border border-transparent bg-white shadow-[0px_4px_35px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#8C52FF]/20 hover:shadow-[0px_20px_50px_rgba(140,82,255,0.15)]"
                  >
                    <div className="relative h-[240px] w-full overflow-hidden md:h-[325px]">
                        <Image
                          src={getImageUrl(post)}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      <div className="absolute top-4 right-4 z-10 translate-y-2 rounded-full bg-white/90 p-2 opacity-0 shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <ArrowUpRight className="h-5 w-5 text-[#8C52FF]" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 p-4 md:p-6">
                      <h3 className="font-dm-sans text-[clamp(1.25rem,2vw,1.5rem)] leading-tight font-semibold text-[#1E1F21] capitalize transition-colors group-hover:text-[#8C52FF]">
                        {post.title}
                      </h3>
                      <p className="font-dm-sans line-clamp-2 text-[clamp(0.875rem,1.5vw,1.125rem)] leading-[1.5] font-normal text-[#667085]">
                        {post.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
