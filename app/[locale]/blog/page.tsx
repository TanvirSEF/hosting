'use client';

import {
  BlogHero,
  BlogNav,
  FeaturedGrid,
  LatestPosts,
  Pagination,
  BlogCTA,
} from '@/components/blog';
import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { calculateReadTime } from '@/lib/blog-utils';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  featuredImage?: {
    url: string;
    alt: string;
  };
  category: string;
  publishedAt: string;
  author: {
    name: string;
  };
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
}

export default function BlogPage() {
  const t = useTranslations('blogPage');
  const locale = useLocale();
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const postsPerPage = 10;
  const fallbackImage = t('fallbackImage') || '/images/blog/hosting-guide.png';
  const defaultReadTime = t('defaultReadTime') || '5 min read';
  const fallbackCategoryIcon = t('fallbackCategoryIcon') || '📄';
  const blogPostBase = t('routes.postBase') || '/blog';

  useEffect(() => {
    loadData();
  }, [currentPage]);

  async function loadData() {
    setLoading(true);
    try {
      const [postsRes, categoriesRes] = await Promise.all([
        fetch(
          `/api/blog/posts?locale=${locale}&limit=${postsPerPage}&skip=${(currentPage - 1) * postsPerPage}`
        ),
        fetch('/api/blog/categories'),
      ]);

      const postsData = await postsRes.json();
      const categoriesData = await categoriesRes.json();

      if (postsData.success) {
        setPosts(postsData.posts);
        setTotal(postsData.total);
      }

      if (categoriesData.success) {
        setCategories(categoriesData.categories);
      }
    } catch (error) {
      console.error('Failed to load blog data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Transform posts to match UI component requirements
  const transformPost = (post: BlogPost) => {
    const categoryName =
      categories.find(
        (c) => c.slug === post.category || c._id === post.category
      )?.name || post.category;

    // Calculate read time from content if available, otherwise use default
    const readTime =
      post.content && typeof document !== 'undefined'
        ? calculateReadTime(post.content)
        : defaultReadTime;

    return {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      image: post.featuredImage?.url || fallbackImage,
      category: categoryName,
      date: new Date(post.publishedAt).toLocaleDateString(locale, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      readTime,
    };
  };

  const transformedPosts = posts.map(transformPost);
  const featuredPosts = transformedPosts.slice(0, 4);
  const latestPosts = transformedPosts.slice(4);
  const totalPages = Math.ceil(total / postsPerPage);

  // Transform categories for BlogNav component
  const navCategories = categories.map((cat) => ({
    id: cat.slug,
    name: cat.name,
    icon: cat.icon || fallbackCategoryIcon,
  }));

  if (loading && posts.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <p>{t('loading')}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      {/* Hero */}
      <BlogHero />

      {/* Navigation with Categories */}
      <BlogNav categories={navCategories} activeCategory="all" />

      {/* Featured Posts Grid */}
      {featuredPosts.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12 xl:px-20">
            <FeaturedGrid posts={featuredPosts} />
          </div>
        </section>
      )}

      {/* Latest Posts */}
      {latestPosts.length > 0 && (
        <section className="pb-12 md:pb-16">
          <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12 xl:px-20">
            <LatestPosts posts={latestPosts} title={t('latestPosts')} />

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </section>
      )}

      {/* No posts message */}
      {posts.length === 0 && !loading && (
        <section className="py-16">
          <div className="container mx-auto max-w-[1400px] px-4 text-center">
            <h2 className="mb-2 text-2xl font-bold">{t('empty.title')}</h2>
            <p className="text-muted-foreground">
              {t('empty.description')}
            </p>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <BlogCTA />
    </main>
  );
}
