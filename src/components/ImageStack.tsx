import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  images: string[];
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const SIZE_CLASS: Record<string, string> = {
  sm: 'max-h-[20vh]',
  md: 'max-h-[35vh]',
  lg: 'max-h-[50vh]',
  full: 'max-h-[70vh]',
};

export default function ImageStack({ images, size = 'md' }: Props) {
  const [idx, setIdx] = useState(0);
  const hClass = SIZE_CLASS[size] || SIZE_CLASS.md;

  if (!images || images.length === 0) return null;
  if (images.length === 1) {
    return <img src={`http://localhost:5678/data/${images[0]}`} alt="" className={`w-full object-contain ${hClass}`} />;
  }

  return (
    <div className="group relative my-4">
      <img
        src={`http://localhost:5678/data/${images[idx]}`}
        alt=""
        className={`w-full object-contain ${hClass}`}
      />
      <button
        onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => setIdx((i) => (i + 1) % images.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-2.5 py-1 text-xs text-white/60">
        {idx + 1} / {images.length}
      </div>
    </div>
  );
}
