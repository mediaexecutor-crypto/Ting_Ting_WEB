'use client';
import { useEffect, useRef, useState, ReactNode } from 'react';

export type PendingFile = {
  id: string;
  file: File;
  name: string; // rename (without extension) — original extension is kept on upload
  previewUrl: string | null;
};

function makePendingFiles(files: File[]): PendingFile[] {
  return files.map((file) => ({
    id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
    file,
    name: file.name.replace(/\.[^.]+$/, ''),
    previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
  }));
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// Pick, drag-and-drop, or paste (Ctrl+V) one or many files. Each queued
// file gets its own rename field; the parent decides what "upload" means
// via renderAction (per-file button) or by uploading the queue itself.
export default function FileDropzone({
  items,
  onChange,
  disabled,
  renderAction,
}: {
  items: PendingFile[];
  onChange: (items: PendingFile[]) => void;
  disabled?: boolean;
  renderAction?: (item: PendingFile) => ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Keep latest values reachable from the window paste listener.
  const itemsRef = useRef(items);
  const onChangeRef = useRef(onChange);
  itemsRef.current = items;
  onChangeRef.current = onChange;

  function addFiles(files: File[]) {
    if (files.length === 0) return;
    onChangeRef.current([...itemsRef.current, ...makePendingFiles(files)]);
  }

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length > 0) {
        e.preventDefault();
        addFiles(files);
      }
    }
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  function removeItem(id: string) {
    const target = items.find((i) => i.id === id);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    onChange(items.filter((i) => i.id !== id));
  }

  function rename(id: string, name: string) {
    onChange(items.map((i) => (i.id === id ? { ...i, name } : i)));
  }

  return (
    <div>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) addFiles(Array.from(e.dataTransfer.files));
        }}
        style={{
          border: `2px dashed ${dragOver ? '#1d4ed8' : '#cbd2db'}`,
          background: dragOver ? '#eff6ff' : '#fafbfc',
          borderRadius: 10,
          padding: '18px 12px',
          textAlign: 'center',
          cursor: disabled ? 'default' : 'pointer',
          fontSize: 13,
        }}
      >
        <div style={{ fontWeight: 700 }}>Drop files here, click to browse, or paste (Ctrl+V)</div>
        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
          You can add several files at once
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            e.target.value = ''; // allow re-picking the same file
          }}
        />
      </div>

      {items.map((item) => (
        <div
          key={item.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 0',
            borderBottom: '1px solid #edf0f3',
          }}
        >
          {item.previewUrl ? (
            <img
              src={item.previewUrl}
              alt=""
              width={40}
              height={40}
              style={{ borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 6,
                background: '#eef1f5',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              📄
            </div>
          )}
          <div style={{ width: 110, minWidth: 0, flexShrink: 0 }}>
            <div
              style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={item.file.name}
            >
              {item.file.name}
            </div>
            <div className="muted" style={{ fontSize: 11 }}>
              {formatSize(item.file.size)}
            </div>
          </div>
          <input
            value={item.name}
            placeholder="Rename"
            onChange={(e) => rename(item.id, e.target.value)}
            disabled={disabled}
            style={{
              flex: 1,
              minWidth: 0,
              border: '1px solid #d8dde5',
              borderRadius: 8,
              padding: 8,
            }}
          />
          {renderAction?.(item)}
          <button
            className="btn secondary"
            onClick={() => removeItem(item.id)}
            disabled={disabled}
            title="Remove from list"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
