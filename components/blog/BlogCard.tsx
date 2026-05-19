'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock } from 'lucide-react';

interface BlogCardProps {
  post: {
    slug: string;
    title: string;
    excerpt: string;
    image: string;
    category: string;
    date: string;
    readTime: string;
  };
  index?: number;
}

export default function BlogCard({ post, index = 0 }: BlogCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/blog/${post.slug}`} className="group block h-full">
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#EAECF0] bg-white shadow-sm transition-all duration-300 hover:shadow-lg">
          {/* Image */}
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute top-4 left-4">
              <span className="rounded-full bg-[#8C52FF]/90 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {post.category}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col p-5 md:p-6">
            <h3 className="font-dm-sans mb-3 line-clamp-2 text-[clamp(1rem,1.8vw,1.25rem)] leading-snug font-semibold text-[#1E1F21] transition-colors duration-200 group-hover:text-[#8C52FF]">
              {post.title}
            </h3>

            <p className="font-dm-sans mb-4 line-clamp-2 flex-1 text-[clamp(0.875rem,1.4vw,0.9375rem)] leading-relaxed text-[#667085]">
              {post.excerpt}
            </p>

            <div className="flex items-center gap-4 border-t border-[#EAECF0] pt-4">
              <div className="flex items-center gap-1.5 text-[clamp(0.75rem,1.2vw,0.8125rem)] text-[#667085]">
                <Calendar className="h-3.5 w-3.5" />
                {post.date}
              </div>
              <div className="flex items-center gap-1.5 text-[clamp(0.75rem,1.2vw,0.8125rem)] text-[#667085]">
                <Clock className="h-3.5 w-3.5" />
                {post.readTime}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
