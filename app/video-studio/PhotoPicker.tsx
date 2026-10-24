'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';

const MAX_SIDE = 1080; // longest edge after downscale
const JPEG_QUALITY = 0.82;

/** Read a File as a dataURL, downscale to <=1080px on the long side, re-encode as JPEG. */
function downscaleToJpeg(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Could not read "${file.name}" — please try again.`));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error(`Could not open "${file.name}" as an image.`));
      img.onload = () => {
        try {
          const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Your browser could not process this image.');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
        } catch (e) {
          reject(e instanceof Error ? e : new Error(`Could not process "${file.name}".`));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function PhotoPicker({
  photos,
  onChange,
  max = 6,
}: {
  photos: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const atCap = photos.length >= max;

  const openPicker = () => {
    if (busy) return;
    if (atCap) {
      setNotice(`You've added all ${max} photos — remove one if you want to swap it.`);
      return;
    }
    setNotice('');
    inputRef.current?.click();
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const picked = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (picked.length === 0) {
      setNotice('Those files are not images — please pick photos of your items.');
      return;
    }
    const room = max - photos.length;
    if (room <= 0) {
      setNotice(`You've added all ${max} photos — remove one if you want to swap it.`);
      return;
    }
    const accepted = picked.slice(0, room);
    const skipped = picked.length - accepted.length;

    setBusy(true);
    setNotice('');
    try {
      const added: string[] = [];
      for (const file of accepted) added.push(await downscaleToJpeg(file));
      onChange([...photos, ...added]);
      const total = photos.length + added.length;
      if (skipped > 0) {
        setNotice(`Added ${accepted.length} of ${picked.length} — videos use at most ${max} photos.`);
      } else if (total >= max) {
        setNotice(`Photo limit reached (${total} / ${max}) — remove one to add a different shot.`);
      }
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not add those photos — please try again.');
    } finally {
      setBusy(false);
    }
  };

  const removeAt = (index: number) => {
    if (busy) return;
    setNotice('');
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="animate-fade-up">
      <div className="flex items-end justify-between gap-3">
        <span className="text-xs font-medium text-[var(--text-soft)] tracking-wide uppercase">Photos</span>
        <span className="text-xs font-medium text-[var(--text-faint)] whitespace-nowrap" aria-live="polite">
          {photos.length} / {max}
        </span>
      </div>
      <p className="text-xs text-[var(--text-faint)] mt-1.5">
        Add photos of your dishes or products — they become the scenes of your video
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
        {photos.map((photo, i) => (
          <div
            key={`${i}-${photo.slice(-24)}`}
            className="relative aspect-square rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--bg-alt)] group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- dataURL thumbnails, not remote images */}
            <img src={photo} alt={`Photo ${i + 1} of ${photos.length}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center bg-[color-mix(in_srgb,var(--bg-alt)_75%,transparent)] backdrop-blur-sm border border-[var(--border)] text-[var(--text-soft)] hover:bg-[color-mix(in_srgb,var(--danger)_20%,transparent)] hover:text-[var(--danger)] hover:border-[color-mix(in_srgb,var(--danger)_40%,transparent)] transition-all"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={openPicker}
          aria-label="Add photos"
          aria-disabled={atCap || busy}
          className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all ${
            atCap
              ? 'border-[var(--border)] text-[var(--text-faint)] opacity-60 cursor-not-allowed'
              : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent-soft)] hover:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)] cursor-pointer'
          }`}
        >
          {busy ? <Loader2 size={20} className="animate-spin text-[var(--accent-soft)]" /> : <ImagePlus size={20} />}
          <span className="text-[11px] font-medium">{busy ? 'Adding…' : 'Add photos'}</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = ''; // allow re-picking the same file
        }}
      />

      {notice && (
        <p
          role="status"
          className="mt-3 text-xs bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-[var(--text-soft)] rounded-xl px-4 py-2.5"
        >
          {notice}
        </p>
      )}
    </div>
  );
}
