'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBlogPost, getBlogCategories } from '@/actions/blog-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import BlogEditor from '@/components/admin/blog/BlogEditor';
import ImageUploader from '@/components/admin/blog/ImageUploader';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminHeader } from '@/components/admin-header';
import {
  AdminTranslationProvider,
  useAdminTranslation,
} from '@/components/AdminTranslationProvider';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface NewBlogPostContentProps {
  admin: any;
}

function NewBlogPostContent({ admin }: NewBlogPostContentProps) {
  const { t } = useAdminTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    locale: 'en',
    tags: '',
    status: 'draft' as 'draft' | 'published',
    metaTitle: '',
    metaDescription: '',
  });

  const [featuredImage, setFeaturedImage] = useState<File | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const result = await getBlogCategories();
    if (result.success && result.categories) {
      setCategories(result.categories);
      if (result.categories.length > 0) {
        setFormData((prev) => ({
          ...prev,
          category: result.categories[0].slug,
        }));
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.excerpt ||
      !formData.content ||
      !formData.category
    ) {
      toast.error(t('blog.toast.fillRequired'));
      return;
    }

    setLoading(true);

    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('excerpt', formData.excerpt);
    submitData.append('content', formData.content);
    submitData.append('category', formData.category);
    submitData.append('locale', formData.locale);
    submitData.append('tags', formData.tags);
    submitData.append('status', formData.status);
    submitData.append('metaTitle', formData.metaTitle || formData.title);
    submitData.append(
      'metaDescription',
      formData.metaDescription || formData.excerpt
    );

    if (featuredImage) {
      submitData.append('featuredImage', featuredImage);
    }

    const result = await createBlogPost(submitData);

    setLoading(false);

    if (result.success) {
      toast.success(t('blog.toast.createSuccess'));
      router.push('/spike/blog');
    } else {
      toast.error(result.error || t('blog.toast.createFailed'));
    }
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AdminSidebar variant="inset" user={admin} />
      <SidebarInset>
        <AdminHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <Link href="/spike/blog">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold">
                    {t('blog.newPostTitle')}
                  </h1>
                  <p className="text-muted-foreground">
                    {t('blog.newPostSubtitle')}
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    {t('blog.form.title')}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder={t('blog.form.titlePlaceholder')}
                    required
                  />
                </div>

                {/* Excerpt */}
                <div className="space-y-2">
                  <Label htmlFor="excerpt">
                    {t('blog.form.excerpt')}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) =>
                      setFormData({ ...formData, excerpt: e.target.value })
                    }
                    placeholder={t('blog.form.excerptPlaceholder')}
                    rows={3}
                    required
                  />
                </div>

                {/* Featured Image */}
                <div className="space-y-2">
                  <Label>{t('blog.form.featuredImage')}</Label>
                  <ImageUploader onChange={setFeaturedImage} />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label>
                    {t('blog.form.content')}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <BlogEditor
                    content={formData.content}
                    onChange={(content) =>
                      setFormData({ ...formData, content })
                    }
                  />
                </div>

                {/* Category, Language & Tags */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">
                      {t('blog.form.category')}{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full rounded-md border px-3 py-2"
                      required
                    >
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat.slug}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="locale">
                      Language{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <select
                      id="locale"
                      value={formData.locale}
                      onChange={(e) =>
                        setFormData({ ...formData, locale: e.target.value })
                      }
                      className="w-full rounded-md border px-3 py-2"
                      required
                    >
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">{t('blog.form.tags')}</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) =>
                        setFormData({ ...formData, tags: e.target.value })
                      }
                      placeholder={t('blog.form.tagsPlaceholder')}
                    />
                  </div>
                </div>

                {/* SEO */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="font-semibold">
                    {t('blog.form.seoSettings')}
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="metaTitle">
                      {t('blog.form.metaTitle')}
                    </Label>
                    <Input
                      id="metaTitle"
                      value={formData.metaTitle}
                      onChange={(e) =>
                        setFormData({ ...formData, metaTitle: e.target.value })
                      }
                      placeholder={t('blog.form.metaTitlePlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metaDescription">
                      {t('blog.form.metaDescription')}
                    </Label>
                    <Textarea
                      id="metaDescription"
                      value={formData.metaDescription}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          metaDescription: e.target.value,
                        })
                      }
                      placeholder={t('blog.form.metaDescriptionPlaceholder')}
                      rows={2}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between border-t pt-6">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="status">{t('blog.form.status')}:</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as any,
                        })
                      }
                      className="rounded-md border px-3 py-2"
                    >
                      <option value="draft">{t('blog.status.draft')}</option>
                      <option value="published">
                        {t('blog.status.published')}
                      </option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <Link href="/admin/blog">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={loading}
                      >
                        {t('blog.cancel')}
                      </Button>
                    </Link>
                    <Button type="submit" disabled={loading}>
                      {loading ? t('blog.creating') : t('blog.createPost')}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

interface NewBlogPostClientWrapperProps {
  admin: any;
}

export function NewBlogPostClientWrapper({
  admin,
}: NewBlogPostClientWrapperProps) {
  return (
    <AdminTranslationProvider>
      <NewBlogPostContent admin={admin} />
    </AdminTranslationProvider>
  );
}
