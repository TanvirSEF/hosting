'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface ImageUploaderProps {
  value?: string;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
}

export default function ImageUploader({
  value,
  onChange,
  onRemove,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | undefined>(value);
  const [newFile, setNewFile] = useState<File | null>(null);

  // Update preview when value changes
  useEffect(() => {
    if (value && !newFile) {
      setPreview(value);
    }
  }, [value, newFile]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setNewFile(file);
        onChange(file);
        const reader = new FileReader();
        reader.onload = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  function handleRemove() {
    setPreview(undefined);
    setNewFile(null);
    onChange(null);
    onRemove?.();
  }

  if (preview) {
    return (
      <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-lg border">
        <Image
          src={preview}
          alt="Preview"
          fill
          className="object-cover"
          unoptimized={
            preview.startsWith('blob:') || preview.startsWith('data:')
          }
        />
        <div className="absolute inset-0 bg-black/0 transition-colors hover:bg-black/10" />
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2"
          onClick={handleRemove}
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="absolute right-2 bottom-2 left-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  onDrop([file]);
                }
              };
              input.click();
            }}
          >
            <Upload className="mr-2 h-4 w-4" />
            Replace Image
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'} hover:border-primary hover:bg-primary/5`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        {isDragActive ? (
          <>
            <Upload className="text-primary h-12 w-12" />
            <p className="text-primary text-sm font-medium">
              Drop image here...
            </p>
          </>
        ) : (
          <>
            <ImageIcon className="text-muted-foreground h-12 w-12" />
            <div>
              <p className="text-sm font-medium">
                Drag & drop an image, or click to select
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                PNG, JPG, WEBP up to 5MB
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
