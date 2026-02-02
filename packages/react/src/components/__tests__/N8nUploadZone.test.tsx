import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { N8nUploadZone } from '../N8nUploadZone';

// Helper for file creation
const createFile = (name: string, size: number = 100, type: string = 'text/plain') => {
  const content = 'x'.repeat(size);
  return new File([content], name, { type });
};

// Helper for DataTransfer mock
const createDataTransfer = (files: File[]) => ({
  files,
  items: files.map((f) => ({ kind: 'file', getAsFile: () => f })),
  types: ['Files'],
});

describe('N8nUploadZone', () => {
  describe('Basic Rendering', () => {
    it('should render component', () => {
      render(<N8nUploadZone onFilesSelected={vi.fn()} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should show default content', () => {
      render(<N8nUploadZone onFilesSelected={vi.fn()} />);

      expect(screen.getByText(/drag.*drop/i)).toBeInTheDocument();
    });

    it('should show custom content', () => {
      render(
        <N8nUploadZone onFilesSelected={vi.fn()}>
          <span data-testid="custom">Custom Content</span>
        </N8nUploadZone>
      );

      expect(screen.getByTestId('custom')).toBeInTheDocument();
    });

    it('should show accept info when provided', () => {
      render(<N8nUploadZone onFilesSelected={vi.fn()} accept="image/*,.pdf" />);

      expect(screen.getByText(/image\/\*.*\.pdf/i)).toBeInTheDocument();
    });

    it('should show maxSize info when provided', () => {
      render(<N8nUploadZone onFilesSelected={vi.fn()} maxSize={5 * 1024 * 1024} />);

      expect(screen.getByText(/5.*MB/i)).toBeInTheDocument();
    });
  });

  describe('Click Selection', () => {
    it('should open file input on click', () => {
      const onFilesSelected = vi.fn();

      render(<N8nUploadZone onFilesSelected={onFilesSelected} />);

      const zone = screen.getByRole('button');
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      const clickSpy = vi.spyOn(input, 'click');

      fireEvent.click(zone);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should call onFilesSelected on file selection', () => {
      const onFilesSelected = vi.fn();
      render(<N8nUploadZone onFilesSelected={onFilesSelected} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createFile('test.txt');

      fireEvent.change(input, { target: { files: [file] } });

      expect(onFilesSelected).toHaveBeenCalledWith([file]);
    });

    it('should reset input after selection', () => {
      const onFilesSelected = vi.fn();
      render(<N8nUploadZone onFilesSelected={onFilesSelected} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createFile('test.txt');

      fireEvent.change(input, { target: { files: [file] } });

      expect(input.value).toBe('');
    });

    it('should not be clickable when disabled', () => {
      const onFilesSelected = vi.fn();

      render(<N8nUploadZone onFilesSelected={onFilesSelected} disabled />);

      const zone = screen.getByRole('button');
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(input, 'click');

      fireEvent.click(zone);

      expect(clickSpy).not.toHaveBeenCalled();
    });
  });

  describe('Drag and Drop', () => {
    it('should accept files on drop', () => {
      const onFilesSelected = vi.fn();
      render(<N8nUploadZone onFilesSelected={onFilesSelected} />);

      const zone = screen.getByRole('button');
      const file = createFile('test.txt');

      fireEvent.drop(zone, {
        dataTransfer: createDataTransfer([file]),
      });

      expect(onFilesSelected).toHaveBeenCalledWith([file]);
    });

    it('should set drag over state', () => {
      const { container } = render(<N8nUploadZone onFilesSelected={vi.fn()} />);

      const zone = screen.getByRole('button');

      fireEvent.dragEnter(zone);

      expect(container.querySelector('.n8n-upload-zone--drag-over')).toBeInTheDocument();
    });

    it('should remove drag over state on leave', () => {
      const { container } = render(<N8nUploadZone onFilesSelected={vi.fn()} />);

      const zone = screen.getByRole('button');

      fireEvent.dragEnter(zone);
      fireEvent.dragLeave(zone);

      expect(container.querySelector('.n8n-upload-zone--drag-over')).not.toBeInTheDocument();
    });

    it('should remove drag over state on drop', () => {
      const { container } = render(<N8nUploadZone onFilesSelected={vi.fn()} />);

      const zone = screen.getByRole('button');
      const file = createFile('test.txt');

      fireEvent.dragEnter(zone);
      fireEvent.drop(zone, {
        dataTransfer: createDataTransfer([file]),
      });

      expect(container.querySelector('.n8n-upload-zone--drag-over')).not.toBeInTheDocument();
    });

    it('should not accept when disabled', () => {
      const onFilesSelected = vi.fn();
      render(<N8nUploadZone onFilesSelected={onFilesSelected} disabled />);

      const zone = screen.getByRole('button');
      const file = createFile('test.txt');

      fireEvent.drop(zone, {
        dataTransfer: createDataTransfer([file]),
      });

      expect(onFilesSelected).not.toHaveBeenCalled();
    });

    it('should prevent default on drag over', () => {
      render(<N8nUploadZone onFilesSelected={vi.fn()} />);

      const zone = screen.getByRole('button');

      const dragOverEvent = new Event('dragover', { bubbles: true, cancelable: true });
      zone.dispatchEvent(dragOverEvent);

      expect(dragOverEvent.defaultPrevented).toBe(true);
    });
  });

  describe('File Type Validation', () => {
    it('should accept files with matching extension', () => {
      const onFilesSelected = vi.fn();
      render(<N8nUploadZone onFilesSelected={onFilesSelected} accept=".pdf,.txt" />);

      const zone = screen.getByRole('button');
      const file = createFile('document.pdf', 100, 'application/pdf');

      fireEvent.drop(zone, { dataTransfer: createDataTransfer([file]) });

      expect(onFilesSelected).toHaveBeenCalledWith([file]);
    });

    it('should accept files with matching MIME type', () => {
      const onFilesSelected = vi.fn();
      render(<N8nUploadZone onFilesSelected={onFilesSelected} accept="image/*" />);

      const zone = screen.getByRole('button');
      const file = createFile('photo.png', 100, 'image/png');

      fireEvent.drop(zone, { dataTransfer: createDataTransfer([file]) });

      expect(onFilesSelected).toHaveBeenCalledWith([file]);
    });

    it('should reject files with non-matching extension', () => {
      const onFilesSelected = vi.fn();
      const onError = vi.fn();

      render(
        <N8nUploadZone onFilesSelected={onFilesSelected} onError={onError} accept=".pdf" />
      );

      const zone = screen.getByRole('button');
      const file = createFile('document.doc', 100, 'application/msword');

      fireEvent.drop(zone, { dataTransfer: createDataTransfer([file]) });

      expect(onFilesSelected).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'invalid-type',
          file,
        })
      );
    });

    it('should support wildcard MIME types', () => {
      const onFilesSelected = vi.fn();
      render(<N8nUploadZone onFilesSelected={onFilesSelected} accept="image/*" multiple maxFiles={2} />);

      const zone = screen.getByRole('button');
      const jpegFile = createFile('photo.jpg', 100, 'image/jpeg');
      const pngFile = createFile('photo.png', 100, 'image/png');

      fireEvent.drop(zone, { dataTransfer: createDataTransfer([jpegFile, pngFile]) });

      expect(onFilesSelected).toHaveBeenCalledWith([jpegFile, pngFile]);
    });

    it('should accept all files when accept not set', () => {
      const onFilesSelected = vi.fn();
      render(<N8nUploadZone onFilesSelected={onFilesSelected} />);

      const zone = screen.getByRole('button');
      const file = createFile('anything.xyz', 100, 'application/octet-stream');

      fireEvent.drop(zone, { dataTransfer: createDataTransfer([file]) });

      expect(onFilesSelected).toHaveBeenCalledWith([file]);
    });
  });

  describe('File Size Validation', () => {
    it('should accept files under maxSize', () => {
      const onFilesSelected = vi.fn();
      render(<N8nUploadZone onFilesSelected={onFilesSelected} maxSize={1000} />);

      const zone = screen.getByRole('button');
      const file = createFile('small.txt', 500);

      fireEvent.drop(zone, { dataTransfer: createDataTransfer([file]) });

      expect(onFilesSelected).toHaveBeenCalledWith([file]);
    });

    it('should reject files over maxSize', () => {
      const onFilesSelected = vi.fn();
      const onError = vi.fn();

      render(
        <N8nUploadZone onFilesSelected={onFilesSelected} onError={onError} maxSize={100} />
      );

      const zone = screen.getByRole('button');
      const file = createFile('large.txt', 500);

      fireEvent.drop(zone, { dataTransfer: createDataTransfer([file]) });

      expect(onFilesSelected).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'file-too-large',
          file,
        })
      );
    });

    it('should have error message with formatted size', () => {
      const onError = vi.fn();

      render(
        <N8nUploadZone
          onFilesSelected={vi.fn()}
          onError={onError}
          maxSize={5 * 1024 * 1024} // 5MB
        />
      );

      const zone = screen.getByRole('button');
      const file = createFile('huge.txt', 10 * 1024 * 1024);

      fireEvent.drop(zone, { dataTransfer: createDataTransfer([file]) });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('5'),
        })
      );
    });
  });

  describe('Max Files Validation', () => {
    it('should enforce maxFiles', () => {
      const onFilesSelected = vi.fn();
      const onError = vi.fn();

      render(
        <N8nUploadZone onFilesSelected={onFilesSelected} onError={onError} maxFiles={2} />
      );

      const zone = screen.getByRole('button');
      const files = [
        createFile('file1.txt'),
        createFile('file2.txt'),
        createFile('file3.txt'),
      ];

      fireEvent.drop(zone, { dataTransfer: createDataTransfer(files) });

      expect(onFilesSelected).toHaveBeenCalledWith([files[0], files[1]]);
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'too-many-files',
        })
      );
    });

    it('should enforce maxFiles=1 for single file', () => {
      const onFilesSelected = vi.fn();

      render(<N8nUploadZone onFilesSelected={onFilesSelected} maxFiles={1} />);

      const zone = screen.getByRole('button');
      const files = [createFile('file1.txt'), createFile('file2.txt')];

      fireEvent.drop(zone, { dataTransfer: createDataTransfer(files) });

      expect(onFilesSelected).toHaveBeenCalledWith([files[0]]);
    });
  });

  describe('Multiple Files', () => {
    it('should accept multiple files when multiple=true', () => {
      render(<N8nUploadZone onFilesSelected={vi.fn()} multiple />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      expect(input).toHaveAttribute('multiple');
    });

    it('should only accept single file when multiple=false', () => {
      render(<N8nUploadZone onFilesSelected={vi.fn()} multiple={false} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      expect(input).not.toHaveAttribute('multiple');
    });

    it('should have multiple disabled by default', () => {
      render(<N8nUploadZone onFilesSelected={vi.fn()} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      expect(input).not.toHaveAttribute('multiple');
    });

    it('should have multiple enabled when prop is set', () => {
      render(<N8nUploadZone onFilesSelected={vi.fn()} multiple />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      expect(input).toHaveAttribute('multiple');
    });
  });

  describe('Disabled State', () => {
    it('should have disabled class', () => {
      const { container } = render(<N8nUploadZone onFilesSelected={vi.fn()} disabled />);

      expect(container.querySelector('.n8n-upload-zone--disabled')).toBeInTheDocument();
    });

    it('should have aria-disabled', () => {
      render(<N8nUploadZone onFilesSelected={vi.fn()} disabled />);

      const zone = screen.getByRole('button');

      expect(zone).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have tabIndex=-1 when disabled', () => {
      render(<N8nUploadZone onFilesSelected={vi.fn()} disabled />);

      const zone = screen.getByRole('button');

      expect(zone).toHaveAttribute('tabIndex', '-1');
    });

    it('should have input disabled', () => {
      render(<N8nUploadZone onFilesSelected={vi.fn()} disabled />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      expect(input).toBeDisabled();
    });
  });

  describe('Keyboard Accessibility', () => {
    it('should activate with Enter', () => {
      render(<N8nUploadZone onFilesSelected={vi.fn()} />);

      const zone = screen.getByRole('button');
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(input, 'click');

      zone.focus();
      fireEvent.keyDown(zone, { key: 'Enter' });

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should activate with Space', () => {
      render(<N8nUploadZone onFilesSelected={vi.fn()} />);

      const zone = screen.getByRole('button');
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(input, 'click');

      zone.focus();
      fireEvent.keyDown(zone, { key: ' ' });

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should clear drag state with Escape', () => {
      const { container } = render(<N8nUploadZone onFilesSelected={vi.fn()} />);

      const zone = screen.getByRole('button');

      fireEvent.dragEnter(zone);
      expect(container.querySelector('.n8n-upload-zone--drag-over')).toBeInTheDocument();

      zone.focus();
      fireEvent.keyDown(zone, { key: 'Escape' });

      expect(container.querySelector('.n8n-upload-zone--drag-over')).not.toBeInTheDocument();
    });

    it('should be focusable', () => {
      render(<N8nUploadZone onFilesSelected={vi.fn()} />);

      const zone = screen.getByRole('button');

      expect(zone).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('ARIA Attributes', () => {
    it('should have role="button"', () => {
      render(<N8nUploadZone onFilesSelected={vi.fn()} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have aria-label', () => {
      render(<N8nUploadZone onFilesSelected={vi.fn()} />);

      const zone = screen.getByRole('button');

      expect(zone).toHaveAttribute('aria-label', expect.stringContaining('Upload'));
    });

    it('should include accept in aria-label', () => {
      render(<N8nUploadZone onFilesSelected={vi.fn()} accept="image/*,.pdf" />);

      const zone = screen.getByRole('button');

      expect(zone.getAttribute('aria-label')).toContain('image/*');
    });

    it('should have hidden input', () => {
      render(<N8nUploadZone onFilesSelected={vi.fn()} />);

      const input = document.querySelector('input[type="file"]');

      expect(input).toHaveAttribute('aria-hidden', 'true');
      expect(input).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('className', () => {
    it('should apply className to root element', () => {
      const { container } = render(
        <N8nUploadZone onFilesSelected={vi.fn()} className="custom-upload-zone" />
      );

      expect(container.querySelector('.custom-upload-zone')).toBeInTheDocument();
    });

    it('should keep base class', () => {
      const { container } = render(
        <N8nUploadZone onFilesSelected={vi.fn()} className="custom" />
      );

      expect(container.querySelector('.n8n-upload-zone')).toBeInTheDocument();
      expect(container.querySelector('.custom')).toBeInTheDocument();
    });
  });

  describe('Client Component', () => {
    it('should have "use client" directive', async () => {
      const fs = await import('fs/promises');
      const path = await import('path');

      const componentPath = path.resolve(__dirname, '../N8nUploadZone.tsx');
      const content = await fs.readFile(componentPath, 'utf-8');

      expect(
        content.startsWith("'use client'") || content.startsWith('"use client"')
      ).toBe(true);
    });
  });
});
