'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getBlogPostById,
  updateBlogPost,
  getBlogCategories,
} from '@/actions/blog-actions';
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

interface EditBlogPostContentProps {
  admin: any;
  postId: string;
}

function EditBlogPostContent({ admin, postId }: EditBlogPostContentProps) {
  const { t } = useAdminTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [postResult, categoriesResult] = await Promise.all([
        getBlogPostById(postId),
        getBlogCategories(),
      ]);

      if (categoriesResult.success && categoriesResult.categories) {
        setCategories(categoriesResult.categories);
      }

      if (postResult.success && postResult.post) {
        const post = postResult.post;
        setFormData({
          title: post.title || '',
          excerpt: post.excerpt || '',
          content: post.content || '',
          category: post.category || '',
          locale: post.locale || 'en',
          tags: post.tags?.join(', ') || '',
          status: post.status || 'draft',
          metaTitle: post.seo?.metaTitle || '',
          metaDescription: post.seo?.metaDescription || '',
        });

        if (post.featuredImage?.url) {
          setCurrentImageUrl(post.featuredImage.url);
          setRemoveImage(false);
        }
      } else {
        toast.error(postResult.error || t('blog.toast.postNotFound'));
        setTimeout(() => {
          router.push('/spike/blog');
        }, 2000);
      }
    } catch (error: any) {
      toast.error(error.message || t('blog.toast.loadFailed'));
      setTimeout(() => {
        router.push('/spike/blog');
      }, 2000);
    } finally {
      setLoading(false);
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

    setSubmitting(true);

    const submitData = new FormData();
    submitData.append('title', formData.title.trim());
    submitData.append('excerpt', formData.excerpt.trim());
    submitData.append('content', formData.content);
    submitData.append('category', formData.category);
    submitData.append('locale', formData.locale);
    submitData.append('tags', formData.tags.trim());
    submitData.append('status', formData.status);
    submitData.append(
      'metaTitle',
      (formData.metaTitle || formData.title).trim()
    );
    submitData.append(
      'metaDescription',
      (formData.metaDescription || formData.excerpt).trim()
    );

    // Handle image: new file, removal, or keep existing
    if (featuredImage && featuredImage instanceof File) {
      submitData.append('featuredImage', featuredImage);
      submitData.append('removeImage', 'false');
    } else if (removeImage) {
      // Signal to remove the image
      submitData.append('removeImage', 'true');
    } else {
      submitData.append('removeImage', 'false');
    }

    const result = await updateBlogPost(postId, submitData);

    setSubmitting(false);

    if (result.success) {
      toast.success(t('blog.toast.updateSuccess'));
      router.push('/spike/blog');
    } else {
      toast.error(result.error || t('blog.toast.updateFailed'));
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
            {loading ? (
              <div className="flex min-h-[60vh] items-center justify-center p-6">
                <div className="space-y-2 text-center">
                  <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
                  <p className="text-muted-foreground">
                    {t('blog.loadingPost')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <Link href="/spike/blog">
                    <Button variant="ghost" size="icon">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                  <div>
                    <h1 className="text-2xl font-bold sm:text-3xl">
                      {t('blog.editPostTitle')}
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      {t('blog.editPostSubtitle')}
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
                    <ImageUploader
                      value={currentImageUrl}
                      onChange={(file) => {
                        setFeaturedImage(file);
                        if (file) {
                          setRemoveImage(false);
                        }
                      }}
                      onRemove={() => {
                        setCurrentImageUrl('');
                        setFeaturedImage(null);
                        setRemoveImage(true);
                      }}
                    />
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="category">
                        {t('blog.form.category')}{' '}
                        <span className="text-destructive">*</span>
                      </Label>
                      {categories.length > 0 ? (
                        <select
                          id="category"
                          value={formData.category}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              category: e.target.value,
                            })
                          }
                          className="bg-background w-full rounded-md border px-3 py-2"
                          required
                        >
                          <option value="">
                            {t('blog.form.selectCategory')}
                          </option>
                          {categories.map((cat) => (
                            <option key={cat._id} value={cat.slug}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="bg-muted text-muted-foreground w-full rounded-md border px-3 py-2">
                          {t('blog.loadingCategories')}
                        </div>
                      )}
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
                        className="bg-background w-full rounded-md border px-3 py-2"
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
                          setFormData({
                            ...formData,
                            metaTitle: e.target.value,
                          })
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
                  <div className="flex flex-col items-stretch justify-between gap-4 border-t pt-6 sm:flex-row sm:items-center">
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
                        className="bg-background rounded-md border px-3 py-2"
                      >
                        <option value="draft">{t('blog.status.draft')}</option>
                        <option value="published">
                          {t('blog.status.published')}
                        </option>
                      </select>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                      <Link href="/admin/blog" className="w-full sm:w-auto">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={submitting}
                          className="w-full sm:w-auto"
                        >
                          {t('blog.cancel')}
                        </Button>
                      </Link>
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full sm:w-auto"
                      >
                        {submitting ? t('blog.updating') : t('blog.updatePost')}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

interface EditBlogPostClientWrapperProps {
  admin: any;
  postId: string;
}

export function EditBlogPostClientWrapper({
  admin,
  postId,
}: EditBlogPostClientWrapperProps) {
  return (
    <AdminTranslationProvider>
      <EditBlogPostContent admin={admin} postId={postId} />
    </AdminTranslationProvider>
  );
}
