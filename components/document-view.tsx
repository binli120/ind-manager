'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { fetchUserDocuments } from '@/lib/store/slices/documentsSlice';
import { useEffect } from 'react';
//import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CommentsPanel } from '@/components/comments-panel';
import { DataTable } from '@/components/data-table';
import {
  AlertTriangle,
  Calendar,
  Clock,
  Edit3,
  FileText,
  MessageSquare,
  MoreHorizontal,
  Play,
  User,
  Users,
} from 'lucide-react';

interface DocumentViewProps {
  onViewChange?: (
    view:
      | 'workspace'
      | 'projects'
      | 'calendar'
      | 'submission'
      | 'post-submission'
      | 'gap-analysis'
      | 'review-center'
      | 'document-authoring'
      | 'tenants'
      | 'users'
  ) => void;
}

export function DocumentView({ onViewChange }: DocumentViewProps) {
  const dispatch = useAppDispatch();
  const { currentDocument, isLoading } = useAppSelector(
    (state) => state.documents
  );
  const { currentTeam } = useAppSelector((state) => state.teams);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUserDocuments(user.id));
    }
  }, [dispatch, user?.id]);

  const documentMetadata = currentDocument
    ? [
        {
          label: 'Document Status',
          value: currentDocument.status,
          icon: FileText,
          status: 'draft',
        },
        {
          label: 'Document Owner',
          value: currentDocument.ownerName || 'Unknown',
          icon: User,
        },
        { label: 'My Roles', value: 'Author', icon: Users },
        {
          label: 'Due Date',
          value: currentDocument.dueDate || 'Not set',
          icon: Calendar,
        },
        {
          label: 'Last Modified',
          value: currentDocument.lastModified || 'Unknown',
          icon: Clock,
        },
        { label: 'Active Users', value: '1 active', icon: Users },
      ]
    : [];

  return (
    <div className='flex-1 overflow-y-auto'>
      {/* Document Header */}
      <div className='bg-background border-b border-border px-8 py-6'>
        <div className='flex items-start justify-between mb-6'>
          <div>
            <div className='flex items-center gap-3 mb-2'>
              <h1 className='text-2xl font-bold text-foreground'>Workspace</h1>
              <Badge variant='secondary'>
                <Users className='w-3 h-3 mr-1' />
                {currentTeam?.name || 'No Team Selected'}
              </Badge>
            </div>
            <p className='text-muted'>Document authoring and review center</p>
          </div>
        </div>

        {/* Action Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <Card
            className='hover:shadow-md transition-shadow cursor-pointer'
            onClick={() => onViewChange?.('document-authoring')}
          >
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center'>
                  <FileText className='w-5 h-5 text-primary' />
                </div>
                <div>
                  <h3 className='font-semibold'>Document Authoring</h3>
                  <p className='text-sm text-muted'>
                    Create and edit documents
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className='hover:shadow-md transition-shadow cursor-pointer'
            onClick={() => onViewChange?.('review-center')}
          >
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center'>
                  <MessageSquare className='w-5 h-5 text-secondary' />
                </div>
                <div>
                  <h3 className='font-semibold'>Review Center</h3>
                  <p className='text-sm text-muted'>Collaborate and review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className='hover:shadow-md transition-shadow cursor-pointer'
            onClick={() => onViewChange?.('gap-analysis')}
          >
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-chart-1/10 rounded-lg flex items-center justify-center'>
                  <AlertTriangle className='w-5 h-5 text-chart-1' />
                </div>
                <div>
                  <h3 className='font-semibold'>Gap Analysis</h3>
                  <p className='text-sm text-muted'>Identify missing content</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Document Content */}
      <div className='px-8 py-6'>
        {isLoading ? (
          <div className='text-center py-12'>
            <div className='w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-muted-foreground'>Loading documents...</p>
          </div>
        ) : currentDocument ? (
          <>
            {/* Document Title and Actions */}
            <div className='flex items-start justify-between mb-6'>
              <div className='flex items-center gap-3'>
                <h2 className='text-xl font-semibold text-foreground'>
                  {currentDocument.title}
                </h2>
                <Button variant='ghost' size='sm' className='text-muted'>
                  View section details
                </Button>
              </div>

              <Button className='bg-primary text-primary-foreground hover:bg-primary/90'>
                <MoreHorizontal className='w-4 h-4 mr-2' />
                Actions
              </Button>
            </div>

            {/* Document Metadata */}
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8'>
              {documentMetadata.map((item) => (
                <div key={item.label} className='space-y-2 text-center'>
                  <div className='flex items-center justify-center gap-2 text-sm text-muted'>
                    <item.icon className='w-4 h-4' />
                    <span>{item.label}</span>
                  </div>
                  <div className='flex items-center justify-center gap-2'>
                    {item.status === 'draft' ? (
                      <Badge
                        variant='outline'
                        className='text-muted border-muted'
                      >
                        {item.value}
                      </Badge>
                    ) : (
                      <span className='text-sm font-medium'>{item.value}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Generated Document Section */}
            <Card className='mb-8'>
              <CardHeader className='pb-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='text-lg font-semibold'>
                      Generated Document
                    </h3>
                    <p className='text-sm text-muted'>
                      Create and edit document
                    </p>
                  </div>
                  <Button variant='outline' size='sm'>
                    <Edit3 className='w-4 h-4 mr-2' />
                    Start Editing
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className='flex gap-6'>
                  {/* Document Content Area */}
                  <div className='flex-1'>
                    <div className='bg-card rounded-lg p-6 border border-border'>
	                      <div className='flex items-center gap-2 text-sm text-muted mb-4'>
	                        <Play className='w-4 h-4' />
	                        <span>
	                          Click &quot;Start Editing&quot; to begin editing this section
	                        </span>
	                      </div>

                      <div className='space-y-6'>
                        <div>
                          <h4 className='font-medium italic mb-4'>
                            {currentDocument.title}
                          </h4>
                        </div>

                        <div>
                          <h5 className='font-medium mb-2'>
                            {currentDocument.content ||
                              'Document content will appear here'}
                          </h5>
                        </div>

                        {/* Data Table */}
                        <DataTable />
                      </div>
                    </div>
                  </div>

                  {/* Comments Panel */}
                  <div className='flex-shrink-0'>
                    <CommentsPanel />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className='text-center py-12'>
            <div className='w-12 h-12 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-3'>
              <FileText className='w-6 h-6 text-muted' />
            </div>
            <p className='text-muted-foreground'>No document selected</p>
            <p className='text-sm text-muted-foreground mt-1'>
              Select a document from the sidebar to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
