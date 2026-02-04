'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, ImageIcon, Sparkles, Table, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export type TableData = {
  id?: string;
  title?: string;
  headers?: string[];
  rows?: string[][];
};

export type ImageData = {
  id?: string;
  title?: string;
  caption?: string;
  url?: string;
};

export interface MaterialItem {
  id?: string;
  type: 'text' | 'table' | 'image' | 'summary';
  content?: string;
  originalText?: string;
  data?: TableData | ImageData;
  timestamp: Date;
}

const isTableData = (data: unknown): data is TableData =>
  !!data &&
  typeof data === 'object' &&
  ('headers' in (data as object) || 'rows' in (data as object));

const isImageData = (data: unknown): data is ImageData =>
  !!data &&
  typeof data === 'object' &&
  ('title' in (data as object) ||
    'caption' in (data as object) ||
    'url' in (data as object));

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

  // Auto-select all items when dialog opens so insert works without extra clicks
  useEffect(() => {
    if (open && materials.length) {
      setSelectedIndices(new Set(materials.map((_, idx) => idx)));
    }
  }, [open, materials]);

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
      total: materials.length,
      selectedIndices: Array.from(selectedIndices),
    });
    const selectedMaterials = materials.filter((_, index) =>
      selectedIndices.has(index),
    );
    console.info("[materials] inserting materials", {
      ids: selectedMaterials.map((m, idx) => m.id ?? `idx-${idx}`),
      types: selectedMaterials.map((m) => m.type),
    });
    onInsertMaterials(selectedMaterials);
    setSelectedIndices(new Set());
    onOpenChange(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'table':
        return <Table className='h-4 w-4 text-blue-600' />;
      case 'image':
        return <ImageIcon className='h-4 w-4 text-green-600' />;
      case 'summary':
        return <Sparkles className='h-4 w-4 text-purple-600' />;
      default:
        return <FileText className='h-4 w-4 text-gray-600' />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'table':
        return 'Table';
      case 'image':
        return 'Image';
      case 'summary':
        return 'AI Summary';
      default:
        return 'Text';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'table':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'image':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'summary':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const renderMaterialPreview = (material: MaterialItem) => {
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
            My Materials ({materials.length})
          </DialogTitle>
        </DialogHeader>

        {materials.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <FileText className='h-12 w-12 text-muted-foreground/50 mb-4' />
            <p className='text-muted-foreground'>No materials collected yet.</p>
            <p className='text-sm text-muted-foreground mt-1'>
              Select text, tables, or images from the materials dialog to add
              them here.
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className='h-[400px] pr-4'>
              <div className='space-y-3'>
                {materials.map((material, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 transition-colors ${
                      selectedIndices.has(index)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent/30'
                    }`}
                  >
                    <div className='flex items-start gap-3'>
                      <Checkbox
                        checked={selectedIndices.has(index)}
                        onCheckedChange={() => toggleSelection(index)}
                        className='mt-1'
                      />
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center justify-between gap-2'>
                          <div className='flex items-center gap-2'>
                            {getTypeIcon(material.type)}
                            <Badge className={getTypeBadgeColor(material.type)}>
                              {getTypeLabel(material.type)}
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
                {selectedIndices.size} of {materials.length} selected
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
