'use client';

export function ImageUploader({ onSelect, label = '画像を選択' }: { onSelect: (file: File) => void; label?: string }) {
  return (
    <label className="button secondary">
      {label}
      <input
        className="hidden"
        type="file"
        accept="image/*"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (file) onSelect(file);
        }}
      />
    </label>
  );
}
