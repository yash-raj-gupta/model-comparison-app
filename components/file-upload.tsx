'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileAttachment, processFiles, formatFileSize, MAX_FILES, isImageFile } from '@/lib/file-utils';
import { Upload, X, FileText, Image, FileCode, File, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
  files: FileAttachment[];
  onFilesChange: (files: FileAttachment[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export function FileUpload({ files, onFilesChange, maxFiles = MAX_FILES, disabled = false }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || files.length >= maxFiles) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    await processAndAddFiles(droppedFiles);
  }, [files.length, maxFiles, disabled]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const selectedFiles = Array.from(e.target.files);
    await processAndAddFiles(selectedFiles);

    // Reset input
    e.target.value = '';
  }, [files.length, maxFiles]);

  const processAndAddFiles = async (newFiles: File[]) => {
    setErrors([]);

    const remainingSlots = maxFiles - files.length;
    const filesToProcess = newFiles.slice(0, remainingSlots);

    if (newFiles.length > remainingSlots) {
      setErrors([`Only ${remainingSlots} more file${remainingSlots === 1 ? '' : 's'} allowed`]);
    }

    const { attachments, errors: processingErrors } = await processFiles(filesToProcess);

    if (processingErrors.length > 0) {
      setErrors(prev => [...prev, ...processingErrors]);
    }

    if (attachments.length > 0) {
      onFilesChange([...files, ...attachments]);
    }
  };

  const removeFile = (id: string) => {
    onFilesChange(files.filter(f => f.id !== id));
    setErrors([]);
  };

  const getFileIcon = (type: string) => {
    if (isImageFile(type)) return <Image className="h-4 w-4" />;
    if (type.includes('code') || type.includes('javascript') || type.includes('json') || type.includes('typescript')) {
      return <FileCode className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const canAddMore = files.length < maxFiles && !disabled;

  return (
    <div className="space-y-3">
      {/* Drag and drop zone */}
      {canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            relative cursor-pointer rounded-lg border-2 border-dashed p-4
            transition-all duration-200
            ${isDragging
              ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20'
              : 'border-zinc-300 bg-zinc-50 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-zinc-600'
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".txt,.md,.pdf,.doc,.docx,.js,.jsx,.ts,.tsx,.html,.css,.py,.json,.xml,.yaml,.yml,.c,.cpp,.h,.hpp,.java,.go,.rs,.rb,.php,.swift,.png,.jpg,.jpeg,.webp,.gif"
          />
          <div className="flex flex-col items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <Upload className="h-5 w-5" />
            <div className="text-center">
              <p className="text-sm font-medium">
                Drop files here or click to browse
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                PDF, TXT, MD, code files, images (max 5MB each)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error messages */}
      <AnimatePresence>
        {errors.map((error, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((file) => (
              <motion.div
                key={file.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between rounded-md bg-zinc-100 px-3 py-2 dark:bg-zinc-800"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex-shrink-0 text-zinc-500 dark:text-zinc-400">
                    {getFileIcon(file.type)}
                  </div>
                  <span className="truncate text-sm text-zinc-700 dark:text-zinc-300">
                    {file.name}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                    ({formatFileSize(file.size)})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  disabled={disabled}
                  className="h-6 w-6 p-0 flex-shrink-0 text-zinc-400 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FileAttachmentBadge({ file, onRemove }: { file: FileAttachment; onRemove?: () => void }) {
  const getIcon = () => {
    if (isImageFile(file.type)) return <Image className="h-3 w-3" />;
    if (file.type.includes('code') || file.name.match(/\.(js|ts|jsx|tsx|py|json)$/)) {
      return <FileCode className="h-3 w-3" />;
    }
    return <File className="h-3 w-3" />;
  };

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
      {getIcon()}
      <span className="max-w-[120px] truncate">{file.name}</span>
      <span className="text-zinc-400">({formatFileSize(file.size)})</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 text-zinc-400 hover:text-red-500"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
