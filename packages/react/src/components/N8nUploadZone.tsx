'use client';

import React, {
  useCallback,
  useRef,
  useState,
  type DragEvent,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

/**
 * Type of upload validation error.
 */
export type UploadErrorType = 'file-too-large' | 'invalid-type' | 'too-many-files';

/**
 * Upload validation error.
 */
export interface UploadError {
  /** The type of validation error */
  type: UploadErrorType;
  /** The file that caused the error (if applicable) */
  file?: File;
  /** Human-readable error message */
  message: string;
}

/**
 * Props for the N8nUploadZone component.
 */
export interface N8nUploadZoneProps {
  /**
   * Callback when files are selected
   */
  onFilesSelected: (files: File[]) => void;
  /**
   * Accepted file types (e.g., 'image/*', '.pdf', 'application/json')
   * Can be a comma-separated string or an array of patterns.
   */
  accept?: string | string[];
  /**
   * Maximum file size in bytes
   */
  maxSize?: number;
  /**
   * Maximum number of files
   * @default 1
   */
  maxFiles?: number;
  /**
   * Allow multiple file selection
   * @default false
   */
  multiple?: boolean;
  /**
   * Disable the upload zone
   * @default false
   */
  disabled?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Custom content inside the drop zone
   */
  children?: ReactNode;
  /**
   * Error callback for validation failures
   */
  onError?: (error: UploadError) => void;
}

/**
 * Drag-and-drop file upload component.
 *
 * Provides a customizable drop zone for file uploads with validation
 * for file types, sizes, and counts. Fully accessible with keyboard
 * and screen reader support.
 *
 * @example
 * ```tsx
 * function FileUploader() {
 *   const [files, setFiles] = useState<File[]>([]);
 *
 *   return (
 *     <N8nUploadZone
 *       onFilesSelected={setFiles}
 *       accept="image/*,.pdf"
 *       maxSize={5 * 1024 * 1024} // 5MB
 *       maxFiles={3}
 *       onError={(err) => toast.error(err.message)}
 *     >
 *       <p>Drag files here or click to select</p>
 *       <p className="text-sm text-gray-500">Max 5MB, images or PDF</p>
 *     </N8nUploadZone>
 *   );
 * }
 * ```
 */
export function N8nUploadZone({
  onFilesSelected,
  accept,
  maxSize,
  maxFiles = 1,
  multiple = false,
  disabled = false,
  className = '',
  children,
  onError,
}: N8nUploadZoneProps): JSX.Element {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse accept into array of patterns (supports string or string[])
  const acceptPatterns = Array.isArray(accept)
    ? accept
    : accept?.split(',').map((s) => s.trim()) ?? [];

  // Normalized accept string for HTML input and display
  const acceptString = Array.isArray(accept) ? accept.join(', ') : accept;

  // Check if file type is accepted
  const isFileTypeAccepted = useCallback(
    (file: File): boolean => {
      if (acceptPatterns.length === 0) return true;

      return acceptPatterns.some((pattern) => {
        // Extension pattern: .pdf, .jpg
        if (pattern.startsWith('.')) {
          return file.name.toLowerCase().endsWith(pattern.toLowerCase());
        }
        // MIME type pattern: image/*, application/json
        if (pattern.includes('/')) {
          if (pattern.endsWith('/*')) {
            const prefix = pattern.slice(0, -2);
            return file.type.startsWith(prefix);
          }
          return file.type === pattern;
        }
        return false;
      });
    },
    [acceptPatterns]
  );

  // Validate files and return valid ones
  const validateFiles = useCallback(
    (fileList: FileList | File[]): File[] => {
      const files = Array.from(fileList);
      const validFiles: File[] = [];

      for (const file of files) {
        // Check max files
        if (validFiles.length >= maxFiles) {
          onError?.({
            type: 'too-many-files',
            message: `Maximum ${maxFiles} file${maxFiles === 1 ? '' : 's'} allowed`,
          });
          break;
        }

        // Check file type
        if (!isFileTypeAccepted(file)) {
          onError?.({
            type: 'invalid-type',
            file,
            message: `File type not accepted: ${file.name}`,
          });
          continue;
        }

        // Check file size
        if (maxSize && file.size > maxSize) {
          onError?.({
            type: 'file-too-large',
            file,
            message: `File too large: ${file.name} (max ${formatFileSize(maxSize)})`,
          });
          continue;
        }

        validFiles.push(file);
      }

      return validFiles;
    },
    [maxFiles, maxSize, isFileTypeAccepted, onError]
  );

  // Handle file selection
  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      const validFiles = validateFiles(fileList);
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    },
    [validateFiles, onFilesSelected]
  );

  // Drag event handlers
  const handleDragEnter = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles]
  );

  // Click handler
  const handleClick = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled]);

  // Input change handler
  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // Reset input to allow selecting same file again
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [handleFiles]
  );

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
      if (e.key === 'Escape') {
        setIsDragOver(false);
      }
    },
    [handleClick]
  );

  const baseClass = 'n8n-upload-zone';
  const stateClasses = [isDragOver && `${baseClass}--drag-over`, disabled && `${baseClass}--disabled`]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={`${baseClass} ${stateClasses} ${className}`.trim()}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label={`Upload files${acceptString ? `, accepted types: ${acceptString}` : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptString}
        multiple={multiple}
        disabled={disabled}
        onChange={handleInputChange}
        className={`${baseClass}__input`}
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className={`${baseClass}__content`}>
        {children || (
          <>
            <UploadIcon />
            <p className={`${baseClass}__text`}>Drag & drop files here, or click to select</p>
            {acceptString && <p className={`${baseClass}__hint`}>Accepted: {acceptString}</p>}
            {maxSize && <p className={`${baseClass}__hint`}>Max size: {formatFileSize(maxSize)}</p>}
          </>
        )}
      </div>
    </div>
  );
}

// Helper components

function UploadIcon(): JSX.Element {
  return (
    <svg
      className="n8n-upload-zone__icon"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Utility functions

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}
