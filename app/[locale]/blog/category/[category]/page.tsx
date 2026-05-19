'use client';

import {
  BlogHero,
  BlogNav,
  LatestPosts,
  Pagination,
  BlogCTA,
} from '@/components/blog';
import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
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

export default function BlogCategoryPage() {
  const t = useTranslations('blogPage');
  const locale = useLocale();
  const params = useParams();
  const categorySlug = params.category as string;

  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const postsPerPage = 10;
  const fallbackImage = t('fallbackImage') || 'https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/blog/hosting-guide.webp';

  useEffect(() => {
    loadData();
  }, [categorySlug, currentPage]);

  async function loadData() {
    setLoading(true);
    try {
      const [postsRes, categoriesRes] = await Promise.all([
        fetch(
          `/api/blog/posts?locale=${locale}&category=${categorySlug}&limit=${postsPerPage}&skip=${(currentPage - 1) * postsPerPage}`
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

  const currentCategory = categories.find((cat) => cat.slug === categorySlug);
  
  // Get translated category name - prioritize translation over database name
  // Try to get translation, if it returns the same as key or contains dots, it doesn't exist
  const translationKey = `categoryNames.${categorySlug}`;
  const translatedValue = t(translationKey);
  const isTranslated = translatedValue && 
                       translatedValue !== translationKey && 
                       !translatedValue.includes('categoryNames.');
  
  // Priority: 1. Translation, 2. Database name, 3. Capitalized slug
  const categoryName = isTranslated ? translatedValue : 
    (currentCategory?.name || 
     categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1));
  const totalPages = Math.ceil(total / postsPerPage);

  // Transform categories for BlogNav component
  const navCategories = categories.map((cat) => ({
    id: cat.slug,
    name: cat.name,
    icon: cat.icon || '📄',
  }));

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      {/* Hero */}
      <BlogHero title={categoryName} />

      {/* Navigation with Categories */}
      <BlogNav categories={navCategories} activeCategory={categorySlug} />

      {/* Category Posts */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12 xl:px-20">
          {loading ? (
            <div className="py-16 text-center">
              <p>{t('loading')}</p>
            </div>
          ) : posts.length > 0 ? (
            <>
              <LatestPosts
                posts={posts.map((post) => ({
                  slug: post.slug,
                  title: post.title,
                  excerpt: post.excerpt,
                  image:
                    post.featuredImage?.url || fallbackImage,
                  category: post.category,
                  date: new Date(post.publishedAt).toLocaleDateString(locale, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }),
                  readTime: '5 min read', // Calculate based on content length if needed
                }))}
                title={`${categoryName} ${t('articles')}`}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          ) : (
            <div className="py-16 text-center">
              <h2 className="font-dm-sans mb-3 text-2xl font-bold text-[#1E1F21]">
                {t('empty.title')}
              </h2>
              <p className="font-dm-sans text-[#667085]">
                {t('empty.description')}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <BlogCTA />
    </main>
  );
}
