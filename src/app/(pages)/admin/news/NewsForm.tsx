import MarkdownEditor from "@/components/MarkdownEditor";
import type { NewsPost } from "@/lib/news";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { cardClass } from "@/components/ui/classes";

interface NewsFormProps {
  action: (formData: FormData) => Promise<void>;
  post?: NewsPost;
  submitLabel: string;
}

const today = () => new Date().toISOString().slice(0, 10);

/** Shared by "New post" and "Edit post". */
export default function NewsForm({ action, post, submitLabel }: NewsFormProps) {
  return (
    <form action={action} className={cardClass("mt-4 space-y-4 p-4")}>
      {post && <input type="hidden" name="id" value={post.id} />}
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required maxLength={150} defaultValue={post?.title} />
      </div>
      <div>
        <Label htmlFor="summary">Summary</Label>
        <Input id="summary" name="summary" maxLength={300} defaultValue={post?.summary} />
      </div>
      <div>
        <Label htmlFor="published_at">Date</Label>
        <Input id="published_at" name="published_at" type="date" className="sm:max-w-56" required defaultValue={post?.date ?? today()} />
      </div>
      <div>
        <Label htmlFor="body">Message</Label>
        <MarkdownEditor id="body" name="body" required maxLength={20000} heightClass="min-h-72" defaultValue={post?.body} />
      </div>
      <Button type="submit" variant="primary">{submitLabel}</Button>
    </form>
  );
}
