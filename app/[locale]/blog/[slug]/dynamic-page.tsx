'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Eye } from 'lucide-react';

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

export default function DynamicBlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPost();
  }, [slug]);

  async function loadPost() {
    setLoading(true);
    try {
      const res = await fetch(`/api/blog/posts/${slug}`);
      const data = await res.json();

      if (data.success && data.post) {
        setPost(data.post);

        // Update page title
        if (data.post.seo.metaTitle) {
          document.title = data.post.seo.metaTitle;
        }
      }
    } catch (error) {
      console.error('Failed to load post:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <p>Loading post...</p>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
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
    <main className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <section className="border-b bg-white">
        <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <Link
            href="/blog"
            className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to blog
          </Link>

          <h1 className="mb-4 text-4xl font-bold md:text-5xl">{post.title}</h1>

          <p className="text-muted-foreground mb-6 text-lg">{post.excerpt}</p>

          <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {post.author.name}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {post.views} views
            </div>
            <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium">
              {post.category}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {post.featuredImage && (
        <section className="border-b bg-white">
          <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <Image
                src={post.featuredImage.url}
                alt={post.featuredImage.alt}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </section>
      )}

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <article
            className="prose prose-lg prose-headings:font-bold prose-a:text-primary prose-img:rounded-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-12 border-t pt-8">
              <h3 className="mb-3 text-sm font-semibold">Tags:</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-muted rounded-full px-3 py-1 text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
