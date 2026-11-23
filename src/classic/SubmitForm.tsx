"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Field";

type FormState = "idle" | "compressing" | "uploading" | "submitting" | "success" | "error";

interface SubmitFormProps {
  onSuccess?: () => void;
}

const MAX_DIM = 1920;
const JPEG_QUALITY = 0.82;

function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width >= height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Image compression failed"));
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    img.src = objectUrl;
  });
}

export default function SubmitForm({ onSuccess }: SubmitFormProps = {}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [height, setHeight] = useState("");
  
  // bad-words is large, so it is loaded lazily.
  const [filter, setFilter] = useState<{ isProfane: (text: string) => boolean } | null>(null);

  useEffect(() => {
    import("bad-words").then(({ Filter }) => setFilter(new Filter()));
  }, []);

  const isProfane = filter
    ? filter.isProfane(name) || filter.isProfane(title) || filter.isProfane(description)
    : false;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select an image file.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg("Image must be smaller than 20 MB.");
      return;
    }

    setErrorMsg("");
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");

    if (isProfane) {
      setErrorMsg("Please remove inappropriate language before submitting.");
      return;
    }

    const submitName = name.trim();
    const submitTitle = title.trim();
    const submitDesc = description.trim();
    const file = fileRef.current?.files?.[0];

    if (!submitTitle || !submitName || !file) {
      setErrorMsg("Please fill in all required fields and select a photo.");
      return;
    }

    try {
      setState("compressing");
      const compressed = await compressImage(file);
      const compressedFile = new File([compressed], "photo.jpg", { type: "image/jpeg" });

      setState("uploading");
      const uploadForm = new FormData();
      uploadForm.append("file", compressedFile);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadForm,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error ?? "Image upload failed");
      }

      const { url } = await uploadRes.json();

      setState("submitting");
      const submitRes = await fetch("/api/towers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: submitTitle, 
          description: submitDesc, 
          submitter_name: submitName, 
          image_url: url,
          height: height ? parseFloat(height) : null
        }),
      });

      if (!submitRes.ok) {
        const err = await submitRes.json();
        throw new Error(err.error ?? "Submission failed");
      }

      setState("success");
      if (onSuccess) {
        setTimeout(onSuccess, 1400);
      } else {
        setTimeout(() => router.push("/#towers"), 2000);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="py-10 text-center">
        <div className="mb-4 text-5xl">📡</div>
        <h2 className="mb-2 text-xl font-black text-ink">Mast submitted!</h2>
        <p className="text-muted">{onSuccess ? "Closing…" : "Redirecting to the gallery…"}</p>
      </div>
    );
  }

  const isLoading = state === "compressing" || state === "uploading" || state === "submitting";
  const optional = <span className="font-normal text-muted">(optional)</span>;
  const required = <span className="text-danger">*</span>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* The photo first: it is what the mast is about, and on a phone it is the one big tap target. */}
      <div>
        <Label htmlFor="submit-photo">Photo {required}</Label>
        <button
          type="button"
          className="mast-photo-pick"
          onClick={() => fileRef.current?.click()}
          aria-describedby="submit-photo-hint"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Selected photo" className="mast-photo-pick__preview" />
          ) : (
            <span className="mast-photo-pick__empty">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              <span className="font-bold text-ink">Take or choose a photo</span>
            </span>
          )}
        </button>
        <p id="submit-photo-hint" className="mt-1 text-xs text-muted">{preview ? "Tap the photo to pick another one." : "JPG, PNG or WebP, up to 20 MB."}</p>
        <input id="submit-photo" ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      </div>

      <div>
        <Label htmlFor="submit-title">Which mast? {required}</Label>
        <Input id="submit-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Gerbrandytoren, IJsselstein" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="submit-name">Your name {required}</Label>
          <Input id="submit-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="nickname" placeholder="e.g. Jan" />
        </div>
        <div>
          <Label htmlFor="submit-height">Height (m) {optional}</Label>
          <Input id="submit-height" type="number" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 366.8" step="0.1" />
        </div>
      </div>

      <div>
        <Label htmlFor="submit-description">Description {optional}</Label>
        <Textarea
          id="submit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Height, purpose, why it is spectacular…"
          className="resize-none"
        />
      </div>

      {isProfane && (
        <div className="flex items-center gap-2 rounded-md border border-accent/40 bg-accent-soft px-4 py-3 text-sm font-medium text-accent-text">
          <span>⚠️</span> Please keep the language clean! Inappropriate words detected.
        </div>
      )}

      {errorMsg && !isProfane && (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{errorMsg}</div>
      )}

      <p className="text-xs text-muted">
        Your name, title, description and photo will be shown publicly. Only upload photos you may share. See the{" "}
        <a href="/privacy" className="underline">privacy page</a> and <a href="/terms" className="underline">site rules</a>.
      </p>

      <Button type="submit" variant="primary" disabled={isLoading || isProfane} className="w-full">
        {state === "compressing"
          ? "Optimising image…"
          : state === "uploading"
            ? "Uploading photo…"
            : state === "submitting"
              ? "Submitting mast…"
              : "Submit mast"}
      </Button>
    </form>
  );
}
