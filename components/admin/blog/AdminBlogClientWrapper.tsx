'use client';

import { useState, useEffect } from 'react';
import {
  getBlogPosts,
  deleteBlogPost,
  getBlogCategories,
} from '@/actions/blog-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreVertical, Pencil, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminHeader } from '@/components/admin-header';
import {
  AdminTranslationProvider,
  useAdminTranslation,
} from '@/components/AdminTranslationProvider';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  status: 'draft' | 'published';
  views: number;
  publishedAt?: string;
  createdAt: string;
  author: {
    name: string;
  };
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  postCount: number;
}

interface AdminBlogContentProps {
  admin: any;
}

function AdminBlogContent({ admin }: AdminBlogContentProps) {
  const { t } = useAdminTranslation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'draft' | 'published'
  >('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [localeFilter, setLocaleFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter, localeFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [postsResult, categoriesResult] = await Promise.all([
        getBlogPosts({
          status: statusFilter === 'all' ? undefined : statusFilter,
          category: categoryFilter === 'all' ? undefined : categoryFilter,
          locale: localeFilter === 'all' ? undefined : localeFilter,
        }),
        getBlogCategories(),
      ]);

      if (postsResult.success && postsResult.posts) {
        setPosts(postsResult.posts);
      }

      if (categoriesResult.success && categoriesResult.categories) {
        setCategories(categoriesResult.categories);
      }
    } catch (error) {
      toast.error(t('blog.toast.loadFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(postId: string, title: string) {
    if (!confirm(t('blog.modal.deleteConfirm', { title }))) {
      return;
    }

    const result = await deleteBlogPost(postId);

    if (result.success) {
      toast.success(t('blog.toast.deleteSuccess'));
      loadData();
    } else {
      toast.error(result.error || t('blog.toast.deleteFailed'));
    }
  }

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <div className="space-y-6 p-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{t('blog.title')}</h1>
                  <p className="text-muted-foreground">{t('blog.subtitle')}</p>
                </div>
                <Link href="/spike/blog/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('blog.newPost')}
                  </Button>
                </Link>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-4">
                <div className="relative max-w-sm flex-1">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder={t('blog.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="rounded-md border px-3 py-2"
                >
                  <option value="all">{t('blog.allStatus')}</option>
                  <option value="published">
                    {t('blog.status.published')}
                  </option>
                  <option value="draft">{t('blog.status.draft')}</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-md border px-3 py-2"
                >
                  <option value="all">{t('blog.allCategories')}</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.slug}>
                      {cat.name} ({cat.postCount})
                    </option>
                  ))}
                </select>

                <select
                  value={localeFilter}
                  onChange={(e) => setLocaleFilter(e.target.value)}
                  className="rounded-md border px-3 py-2"
                >
                  <option value="all">All Languages</option>
                  <option value="en">English</option>
                  <option value="sv">Swedish</option>
                </select>
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-lg border">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="max-w-[400px] min-w-[300px]">
                          {t('blog.table.title')}
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          {t('blog.table.category')}
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          {t('blog.table.status')}
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          {t('blog.table.views')}
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          {t('blog.table.author')}
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          {t('blog.table.date')}
                        </TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-8 text-center">
                            {t('blog.loading')}
                          </TableCell>
                        </TableRow>
                      ) : filteredPosts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-8 text-center">
                            {t('blog.noPostsFound')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPosts.map((post) => (
                          <TableRow key={post._id}>
                            <TableCell className="max-w-[400px] min-w-[300px]">
                              <div className="min-w-0">
                                <div
                                  className="truncate font-medium"
                                  title={post.title}
                                >
                                  {post.title}
                                </div>
                                <div
                                  className="text-muted-foreground truncate text-sm"
                                  title={post.excerpt}
                                >
                                  {post.excerpt || t('blog.noExcerpt')}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant="outline">
                                {categories.find(
                                  (c) => c.slug === post.category
                                )?.name || post.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge
                                variant={
                                  post.status === 'published'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {t(`blog.status.${post.status}`)}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4 flex-shrink-0" />
                                {post.views}
                              </div>
                            </TableCell>
                            <TableCell
                              className="max-w-[120px] truncate whitespace-nowrap"
                              title={post.author.name}
                            >
                              {post.author.name}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {post.publishedAt
                                ? format(
                                    new Date(post.publishedAt),
                                    'MMM d, yyyy'
                                  )
                                : format(
                                    new Date(post.createdAt),
                                    'MMM d, yyyy'
                                  )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/spike/blog/edit/${post._id}`}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      {t('blog.edit')}
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDelete(post._id, post.title)
                                    }
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t('blog.delete')}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

interface AdminBlogClientWrapperProps {
  admin: any;
}

export function AdminBlogClientWrapper({ admin }: AdminBlogClientWrapperProps) {
  return (
    <AdminTranslationProvider>
      <AdminBlogContent admin={admin} />
    </AdminTranslationProvider>
  );
}
