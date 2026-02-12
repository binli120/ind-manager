// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, ImageIcon, Table, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

export type TableData = {
  id?: string;
  title?: string;
  headers?: string[];
  rows?: string[][];
  html?: string;
};

export type ImageData = {
  id?: string;
  title?: string;
  caption?: string;
  url?: string;
};

export type TopicData = {
  id?: string;
  title?: string;
  content?: string;
  images?: ImageData[];
  tables?: TableData[];
  document?: {
    id?: string;
    name?: string;
    section?: string;
  };
};

export interface MaterialItem {
  id?: string;
  type: 'text' | 'table' | 'image' | 'summary' | 'topic';
  content?: string;
  originalText?: string;
  data?: TableData | ImageData | TopicData;
  timestamp: Date;
}

const isTableData = (data: unknown): data is TableData =>
  !!data &&
  typeof data === 'object' &&
  ('headers' in (data as object) || 'rows' in (data as object));

const isImageData = (data: unknown): data is ImageData =>
  !!data &&
  typeof data === 'object' &&
  'url' in (data as object);

const isTopicData = (data: unknown): data is TopicData =>
  !!data &&
  typeof data === 'object' &&
  ('content' in (data as object) ||
    'images' in (data as object) ||
    'tables' in (data as object));

interface MyMaterialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materials: MaterialItem[];
  onInsertMaterials: (materials: MaterialItem[]) => void;
  onRemoveMaterial?: (index: number) => void;
}

export function MyMaterialsDialog({
  open,
  onOpenChange,
  materials,
  onInsertMaterials,
  onRemoveMaterial,
}: MyMaterialsDialogProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(),
  );

  const topicEntries = useMemo(
    () =>
      materials
        .map((material, index) => ({ material, index }))
        .filter(
          (entry) =>
            entry.material.type === 'topic' && isTopicData(entry.material.data),
        ),
    [materials],
  );

  // Auto-select all items when dialog opens so insert works without extra clicks
  useEffect(() => {
    if (open && topicEntries.length) {
      setSelectedIndices(new Set(topicEntries.map((_, idx) => idx)));
    }
  }, [open, topicEntries]);

  const toggleSelection = (index: number) => {
    const newSelection = new Set(selectedIndices);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedIndices(newSelection);
  };

  const handleInsert = () => {
    console.info("[materials] insert clicked", {
      selectedCount: selectedIndices.size,
      total: topicEntries.length,
      selectedIndices: Array.from(selectedIndices),
    });
    const selectedMaterials = topicEntries
      .filter((_, index) => selectedIndices.has(index))
      .map((entry) => entry.material);
    console.info("[materials] inserting materials", {
      ids: selectedMaterials.map((m, idx) => m.id ?? `idx-${idx}`),
      types: selectedMaterials.map((m) => m.type),
    });
    onInsertMaterials(selectedMaterials);
    setSelectedIndices(new Set());
    onOpenChange(false);
  };

  const stripHtml = (value: string) =>
    value
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const renderMaterialPreview = (material: MaterialItem) => {
    if (material.type === 'topic' && isTopicData(material.data)) {
      const topic = material.data;
      const topicTitle = topic.title?.trim();
      const textPreview = topic.content ? stripHtml(topic.content).slice(0, 220) : '';
      const imageCount = topic.images?.length ?? 0;
      const tableCount = topic.tables?.length ?? 0;
      return (
        <div className='mt-2 space-y-2'>
          {topicTitle && (
            <p className='text-sm font-semibold text-foreground'>
              {topicTitle}
            </p>
          )}
          {textPreview ? (
            <p className='text-sm text-muted-foreground line-clamp-3'>
              {textPreview}
            </p>
          ) : (
            <p className='text-xs text-muted-foreground'>No text content.</p>
          )}
          <div className='flex items-center gap-4 text-xs text-muted-foreground'>
            <span className='inline-flex items-center gap-1'>
              <ImageIcon className='h-3.5 w-3.5' />
              {imageCount} images
            </span>
            <span className='inline-flex items-center gap-1'>
              <Table className='h-3.5 w-3.5' />
              {tableCount} tables
            </span>
          </div>
          {topic.document?.name && (
            <div className='text-[11px] text-muted-foreground'>
              {topic.document.name} • Section {topic.document.section ?? '—'}
            </div>
          )}
        </div>
      );
    }

    if (material.type === 'table' && isTableData(material.data)) {
      return (
        <div className='overflow-x-auto mt-2'>
          <table className='w-full border-collapse text-xs'>
            <thead>
              <tr className='border-b bg-muted/50'>
                {material.data.headers?.map((header: string, idx: number) => (
                  <th key={idx} className='px-2 py-1 text-left font-semibold'>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(material.data.rows ?? [])
                .slice(0, 2)
                .map((row: string[], rowIdx: number) => (
                  <tr key={rowIdx} className='border-b last:border-0'>
                    {row.map((cell: string, cellIdx: number) => (
                      <td key={cellIdx} className='px-2 py-1'>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              {material.data.rows && material.data.rows.length > 2 && (
                <tr>
                  <td
                    colSpan={material.data.headers?.length}
                    className='px-2 py-1 text-muted-foreground italic'
                  >
                    ... and {(material.data.rows?.length ?? 0) - 2} more rows
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    if (material.type === 'image' && isImageData(material.data)) {
      const imageData = material.data;
      return (
        <div className='mt-2'>
          {imageData.url && (
            <Image
              src={imageData.url}
              alt={imageData.title || 'Selected image'}
              width={640}
              height={360}
              unoptimized
              loader={({ src }) => src}
              className='w-full h-auto max-h-48 object-contain rounded border border-border bg-muted'
            />
          )}
          {imageData.title && (
            <div className='text-sm font-medium'>{imageData.title}</div>
          )}
          {imageData.caption && (
            <div className='text-xs text-muted-foreground'>
              {imageData.caption}
            </div>
          )}
        </div>
      );
    }

    return (
      <p className='text-sm text-muted-foreground mt-2 line-clamp-3'>
        {material.content || material.originalText}
      </p>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='w-[600px] max-w-[90vw] max-h-[80vh]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            My Materials ({topicEntries.length})
          </DialogTitle>
          <DialogDescription className='sr-only'>
            Review selected topics and insert them into your document.
          </DialogDescription>
        </DialogHeader>

        {topicEntries.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <FileText className='h-12 w-12 text-muted-foreground/50 mb-4' />
            <p className='text-muted-foreground'>No topics selected yet.</p>
            <p className='text-sm text-muted-foreground mt-1'>
              Select topics from the materials dialog to add them here.
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className='h-[400px] pr-4'>
              <div className='space-y-3'>
                {topicEntries.map(({ material, index }, entryIndex) => (
                  <div
                    key={material.id ?? index}
                    className={`border rounded-lg p-4 transition-colors ${
                      selectedIndices.has(entryIndex)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent/30'
                    }`}
                  >
                    <div className='flex items-start gap-3'>
                      <Checkbox
                        checked={selectedIndices.has(entryIndex)}
                        onCheckedChange={() => toggleSelection(entryIndex)}
                        className='mt-1'
                      />
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center justify-between gap-2'>
                          <div className='flex items-center gap-2'>
                            <FileText className='h-4 w-4 text-gray-600' />
                            <Badge className='bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'>
                              Topic
                            </Badge>
                            <span className='text-xs text-muted-foreground'>
                              {new Date(
                                material.timestamp,
                              ).toLocaleTimeString()}
                            </span>
                          </div>
                          {onRemoveMaterial && (
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-7 w-7 p-0 text-muted-foreground hover:text-destructive'
                              onClick={() => onRemoveMaterial(index)}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          )}
                        </div>
                        {renderMaterialPreview(material)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <DialogFooter className='flex items-center justify-between sm:justify-between'>
              <div className='text-sm text-muted-foreground'>
                {selectedIndices.size} of {topicEntries.length} selected
              </div>
              <div className='flex gap-2'>
                <Button variant='outline' onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleInsert}
                  disabled={selectedIndices.size === 0}
                  className='gap-2'
                >
                  Insert Selected ({selectedIndices.size})
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
