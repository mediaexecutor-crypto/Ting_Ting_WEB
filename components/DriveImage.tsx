'use client';
import { useState } from 'react';

// Tries each image source in order; if one fails to load (not public,
// not generated yet, blocked, etc.) it moves to the next, and finally to
// a file icon. referrerPolicy avoids Google rejecting hotlinked requests.
export default function DriveImage({
  sources,
  alt,
  size = 260,
}: {
  sources: string[];
  alt: string;
  size?: number;
}) {
  const [index, setIndex] = useState(0);
  const valid = sources.filter(Boolean);

  if (index >= valid.length) {
    return (
      <div
        style={{
          width: size,
          maxWidth: '100%',
          height: Math.round(size * 0.5),
          background: '#eef1f5',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
        }}
      >
        📄
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={valid[index]}
      src={valid[index]}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setIndex((i) => i + 1)}
      style={{ width: size, maxWidth: '100%', borderRadius: 8, display: 'block' }}
    />
  );
}
