import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "@/components/Markdown";
import { findNews, formatDate } from "@/lib/news";

interface Props {
  params: Promise<{ slug: string }>;
}


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await findNews((await params).slug);
  return post ? { title: post.title, description: post.summary } : {};
}

export const instant = false;

export default async function NewsPostPage({ params }: Props) {
  const post = await findNews((await params).slug);
  if (!post) notFound();

  return (
    <article className="container-prose py-14 sm:py-20">
      <Link href="/news" className="text-sm font-medium text-accent-text hover:underline">
        &larr; All news
      </Link>
      <time dateTime={post.date} className="mt-6 block text-sm text-muted">
        {formatDate(post.date)}
      </time>
      <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">{post.title}</h1>
      <Markdown large className="mt-8 text-lg leading-relaxed">{post.body}</Markdown>
    </article>
  );
}
