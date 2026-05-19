'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import {
  Calendar,
  Clock,
  ArrowLeft,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import styles from './blog-content.module.css';
import {
  extractHeadingsFromHTML,
  addIdsToHeadings,
  calculateReadTime,
} from '@/lib/blog-utils';

// Share icons as SVG components
const ShareIcons = {
  Copy: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.8195 3.86848C14.1149 1.57314 17.8363 1.57314 20.1317 3.86848C22.427 6.16383 22.427 9.88532 20.1317 12.1807L18.2653 14.0471C17.8747 14.4376 17.2416 14.4376 16.851 14.0471C16.4605 13.6566 16.4605 13.0234 16.851 12.6329L18.7175 10.7665C20.2318 9.25216 20.2318 6.79699 18.7175 5.2827C17.2032 3.7684 14.748 3.7684 13.2337 5.2827L11.3673 7.14914C10.9768 7.53966 10.3436 7.53966 9.95307 7.14914C9.56254 6.75861 9.56254 6.12545 9.95307 5.73492L11.8195 3.86848ZM7.11793 9.98427C7.50846 10.3748 7.50846 11.008 7.11793 11.3985L5.28245 13.234C3.76815 14.7483 3.76815 17.2034 5.28245 18.7177C6.79675 20.232 9.25191 20.232 10.7662 18.7177L12.6017 16.8822C12.9922 16.4917 13.6254 16.4917 14.0159 16.8822C14.4064 17.2728 14.4064 17.9059 14.0159 18.2965L12.1804 20.1319C9.88507 22.4273 6.16358 22.4273 3.86824 20.1319C1.57289 17.8366 1.57289 14.1151 3.86824 11.8198L5.70372 9.98427C6.09425 9.59375 6.72741 9.59375 7.11793 9.98427Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.9537 8.13749C16.3442 8.52802 16.3442 9.16118 15.9537 9.5517L9.09696 16.4084C8.70644 16.799 8.07328 16.799 7.68275 16.4084C7.29223 16.0179 7.29223 15.3848 7.68275 14.9942L14.5395 8.13749C14.93 7.74697 15.5632 7.74697 15.9537 8.13749Z"
        fill="currentColor"
      />
    </svg>
  ),
  X: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.2117 16.7815H15.0886L7.75913 7.15474H8.96408L16.2117 16.7815Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.5 1.5C4.18629 1.5 1.5 4.18629 1.5 7.5V16.5C1.5 19.8137 4.18629 22.5 7.5 22.5H16.5C19.8137 22.5 22.5 19.8137 22.5 16.5V7.5C22.5 4.18629 19.8137 1.5 16.5 1.5H7.5ZM17.8262 6H15.7999L12.4606 9.83444L9.57387 6H5.39299L10.3884 12.5632L5.65384 17.9999H7.68116L11.3358 13.8053L14.5294 17.9999H18.607L13.3996 11.0833L17.8262 6Z"
        fill="currentColor"
      />
    </svg>
  ),
  Facebook: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.5 1.5C4.18629 1.5 1.5 4.18629 1.5 7.5V16.5C1.5 19.8137 4.18629 22.5 7.5 22.5H16.5C19.8137 22.5 22.5 19.8137 22.5 16.5V7.5C22.5 4.18629 19.8137 1.5 16.5 1.5H7.5ZM8.30273 9.73826H9.99902V7.8243C9.99902 6.10992 10.9014 5.21484 12.9347 5.21484H15.0879V8.04199H13.4566C12.9347 8.04199 12.8262 8.25572 12.8262 8.79571V9.73826H15.0879L14.8854 12H12.8262V18.7852H9.99902V12H8.30273V9.73826Z"
        fill="currentColor"
      />
    </svg>
  ),
  LinkedIn: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.5 1.5C4.18629 1.5 1.5 4.18629 1.5 7.5V16.5C1.5 19.8137 4.18629 22.5 7.5 22.5H16.5C19.8137 22.5 22.5 19.8137 22.5 16.5V7.5C22.5 4.18629 19.8137 1.5 16.5 1.5H7.5ZM7.04294 8.60884C7.75777 8.60884 8.33693 8.02498 8.33693 7.30442C8.33693 6.58438 7.75777 6 7.04294 6C6.32812 6 5.74896 6.58438 5.74896 7.30442C5.74896 8.02498 6.32812 8.60884 7.04294 8.60884ZM5.73853 18.0006V9.65237H8.34736V18.0006H5.73853ZM9.91995 9.65237H12.5121V10.7768C13.6057 8.75285 18.2609 8.60309 18.2609 12.7146V18.0006H15.6584V13.6183C15.6584 10.9824 12.5126 11.1817 12.5126 13.6183V18.0006H9.91995V9.65237Z"
        fill="currentColor"
      />
    </svg>
  ),
};

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: {
    url: string;
    alt: string;
  };
  category: string;
  tags: string[];
  publishedAt: string;
  views: number;
  author: {
    name: string;
  };
  seo: {
    metaTitle?: string;
    metaDescription?: string;
  };
}

interface RelatedPost {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  date: string;
}

export default function BlogPostPage() {
  const t = useTranslations('blogPage');
  const locale = useLocale();
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [categories, setCategories] = useState<
    Array<{ _id: string; name: string; slug: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeHeading, setActiveHeading] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showMobileToc, setShowMobileToc] = useState(false);

  // Extract headings and process content
  const { headings, processedContent, readTime, categoryName } = useMemo(() => {
    if (!post) {
      return {
        headings: [],
        processedContent: '',
        readTime: '5 min read',
        categoryName: '',
      };
    }

    // Add IDs to headings if missing
    const contentWithIds = addIdsToHeadings(post.content);

    // Extract headings for table of contents
    const extractedHeadings = extractHeadingsFromHTML(contentWithIds);

    // Calculate read time
    const calculatedReadTime = calculateReadTime(contentWithIds);

    // Get category name from categories list
    const category = categories.find(
      (c) => c.slug === post.category || c._id === post.category
    );
    const catName = category?.name || post.category;

    return {
      headings: extractedHeadings,
      processedContent: contentWithIds,
      readTime: calculatedReadTime,
      categoryName: catName,
    };
  }, [post, categories]);

  useEffect(() => {
    loadPost();
  }, [slug]);

  async function loadPost() {
    setLoading(true);
    try {
      // Load categories first
      const categoriesRes = await fetch('/api/blog/categories');
      const categoriesData = await categoriesRes.json();
      if (categoriesData.success && categoriesData.categories) {
        setCategories(categoriesData.categories);
      }

      // Load post with locale
      const postRes = await fetch(`/api/blog/posts/${slug}?locale=${locale}`);
      const postData = await postRes.json();

      if (postData.success && postData.post) {
        setPost(postData.post);

        // Update page title
        if (postData.post.seo?.metaTitle) {
          document.title = postData.post.seo.metaTitle;
        }

        // Load related posts (same category, excluding current post)
        try {
          const relatedRes = await fetch(
            `/api/blog/posts?locale=${locale}&limit=6&category=${postData.post.category}`
          );
          const relatedData = await relatedRes.json();

          if (relatedData.success && relatedData.posts) {
            const categoryMap = new Map(
              categoriesData.categories.map(
                (c: { _id: string; name: string; slug: string }) => [
                  c.slug,
                  c.name,
                ]
              )
            );

            const related = relatedData.posts
              .filter((p: BlogPost) => p.slug !== slug)
              .slice(0, 3)
              .map((p: BlogPost) => {
                const catName = categoryMap.get(p.category) || p.category;
                return {
                  slug: p.slug,
                  title: p.title,
                  excerpt: p.excerpt,
                  image:
                    p.featuredImage?.url || '/images/blog/hosting-guide.png',
                  category: catName,
                  date: format(new Date(p.publishedAt), 'MMMM d, yyyy'),
                };
              });
            setRelatedPosts(related);
          }
        } catch (error) {
          console.error('Failed to load related posts:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load post:', error);
    } finally {
      setLoading(false);
    }
  }

  // Scroll spy for TOC
  useEffect(() => {
    if (!post || headings.length === 0) return;

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);

      let currentHeading = '';

      // Find the heading that's closest to top but still in view
      for (let i = 0; i < headings.length; i++) {
        const el = document.getElementById(headings[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // If heading is at or above 150px from top, it's the current section
          if (rect.top <= 150) {
            currentHeading = headings[i].id;
          }
        }
      }

      if (currentHeading) {
        setActiveHeading(currentHeading);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check after a small delay to ensure DOM is ready
    setTimeout(handleScroll, 100);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [post, headings]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    if (!post) return;
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post.title);
    const shareUrls: Record<string, string> = {
      x: `https://x.com/intent/tweet?text=${title}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };
    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p>Loading post...</p>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Post not found</h1>
          <Link href="/blog" className="text-primary hover:underline">
            ← Back to blog
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#06010E]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(140,82,255,0.15)_0%,transparent_50%)]" />
        <div className="pointer-events-none absolute -right-[10%] -bottom-[30%] h-[500px] w-[500px] bg-[radial-gradient(circle,rgba(140,82,255,0.2)_0%,transparent_70%)] blur-[60px]" />

        <div className="relative z-10 container mx-auto max-w-[1200px] px-4 pt-28 pb-10 sm:px-6 md:pt-36 md:pb-14">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('backToBlog')}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-5 flex flex-wrap items-center gap-3"
          >
            <span className="rounded-full bg-[#8C52FF] px-3 py-1.5 text-sm font-medium text-white">
              {categoryName}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-white/60">
              <Calendar className="h-4 w-4" />
              {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
            </span>
            <span className="text-white/40">•</span>
            <span className="flex items-center gap-1.5 text-sm text-white/60">
              <Clock className="h-4 w-4" />
              {readTime}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-dm-sans max-w-4xl text-[clamp(1.75rem,5vw,3.5rem)] leading-[1.15] font-bold text-white"
          >
            {post.title}
          </motion.h1>
        </div>
      </section>

      {/* Content with Sidebar */}
      <div className="container mx-auto max-w-[1200px] px-4 py-8 sm:px-6 md:py-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          {/* Main Content */}
          <article className="min-w-0 flex-1">
            {/* Mobile TOC */}
            {headings.length > 0 && (
              <div className="mb-6 lg:hidden">
                <button
                  onClick={() => setShowMobileToc(!showMobileToc)}
                  className="flex w-full items-center justify-between rounded-xl border border-[#EAECF0] bg-[#FAFAFA] p-4"
                >
                  <span className="text-sm font-medium text-[#1E1F21]">
                    On this page
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-[#667085] transition-transform ${showMobileToc ? 'rotate-180' : ''}`}
                  />
                </button>
                {showMobileToc && (
                  <nav className="mt-2 rounded-xl border border-[#EAECF0] bg-[#FAFAFA] p-4">
                    <ul className="space-y-2">
                      {headings.map((heading) => (
                        <li key={heading.id}>
                          <a
                            href={`#${heading.id}`}
                            onClick={() => setShowMobileToc(false)}
                            className={`block py-1.5 text-sm transition-colors ${
                              heading.isChild ? 'pl-4' : ''
                            } ${
                              activeHeading === heading.id
                                ? 'font-medium text-[#8C52FF]'
                                : 'text-[#667085]'
                            }`}
                          >
                            {heading.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}
              </div>
            )}

            {/* Share Section */}
            <div className="mb-8 flex items-center gap-3 border-b border-[#EAECF0] pb-6">
              <span className="text-sm font-medium text-[#667085]">Share:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="group relative rounded-lg p-2 text-[#667085] transition-colors hover:bg-[#F5F5F5] hover:text-[#8C52FF]"
                  title="Copy link"
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <ShareIcons.Copy />
                  )}
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded bg-[#1E1F21] px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {copied ? 'Copied!' : 'Copy link'}
                  </span>
                </button>
                <button
                  onClick={() => handleShare('x')}
                  className="rounded-lg p-2 text-[#667085] transition-colors hover:bg-[#F5F5F5] hover:text-[#1DA1F2]"
                  title="Share on X"
                >
                  <ShareIcons.X />
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="rounded-lg p-2 text-[#667085] transition-colors hover:bg-[#F5F5F5] hover:text-[#1877F2]"
                  title="Share on Facebook"
                >
                  <ShareIcons.Facebook />
                </button>
                <button
                  onClick={() => handleShare('linkedin')}
                  className="rounded-lg p-2 text-[#667085] transition-colors hover:bg-[#F5F5F5] hover:text-[#0A66C2]"
                  title="Share on LinkedIn"
                >
                  <ShareIcons.LinkedIn />
                </button>
              </div>
            </div>

            {/* Article Content */}
            <div
              className={`${styles.articleContent} max-w-none`}
              dangerouslySetInnerHTML={{ __html: processedContent }}
            />

          </article>

          {/* Sidebar - Table of Contents */}
          {headings.length > 0 && (
            <aside className="hidden w-[280px] flex-shrink-0 lg:block">
              <div className="sticky top-24">
                <div className="rounded-xl border border-[#EAECF0] bg-[#FAFAFA] p-5">
                  <h4 className="mb-4 text-xs font-medium tracking-wider text-[#667085] uppercase">
                    On this page
                  </h4>
                  <nav>
                    <ul className="space-y-1">
                      {headings.map((heading) => (
                        <li key={heading.id}>
                          <a
                            href={`#${heading.id}`}
                            className={`block border-l-2 py-1.5 text-sm transition-colors duration-200 ${
                              heading.isChild ? 'pl-5' : 'pl-3'
                            } ${
                              activeHeading === heading.id
                                ? 'border-[#8C52FF] font-medium text-[#8C52FF]'
                                : 'border-transparent text-[#667085] hover:border-[#E4E7EC] hover:text-[#1E1F21]'
                            }`}
                          >
                            {heading.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>

                {/* Scroll to Top */}
                {showScrollTop && (
                  <button
                    onClick={scrollToTop}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#EAECF0] bg-white py-3 text-[#667085] transition-all hover:border-[#8C52FF]/30 hover:text-[#8C52FF]"
                  >
                    <ChevronUp className="h-4 w-4" />
                    <span className="text-sm font-medium">Back to top</span>
                  </button>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="bg-[#FAFAFA] py-12 md:py-16">
          <div className="container mx-auto max-w-[1200px] px-4 sm:px-6">
            <h2 className="font-dm-sans mb-8 text-center text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-[#1E1F21] md:mb-10">
              Related tutorials
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {relatedPosts.map((post, index) => (
                <motion.article
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="overflow-hidden rounded-xl border border-[#EAECF0] bg-white transition-shadow hover:shadow-lg"
                >
                  <Link href={`/blog/${post.slug}`} className="block">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                    <div className="p-5">
                      <div className="mb-3 flex items-center gap-2 text-xs text-[#667085]">
                        <span>{post.date}</span>
                        <span>•</span>
                        <span className="font-medium text-[#8C52FF] uppercase">
                          {post.category}
                        </span>
                      </div>
                      <h3 className="font-dm-sans mb-2 line-clamp-2 text-[clamp(1rem,1.5vw,1.125rem)] leading-snug font-semibold text-[#1E1F21] transition-colors hover:text-[#8C52FF]">
                        {post.title}
                      </h3>
                      <p className="mb-3 line-clamp-2 text-sm text-[#667085]">
                        {post.excerpt}
                      </p>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
