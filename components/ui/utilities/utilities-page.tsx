'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { NotificationsPanel } from '@/components/ui/utilities/notifications-panel';
import { ReportsPanel } from '@/components/ui/utilities/reports-panel';
import { TemplateEditorPanel } from '@/components/ui/utilities/template-editor-panel';
import { BarChart3, Bell, PenTool } from 'lucide-react';

export default function UtilitiesPage() {
  return (
    <div className='flex-1 overflow-y-auto bg-gray-50/50'>
      <div className='bg-background border-b border-border px-8 py-6'>
        <h1 className='text-3xl font-bold text-foreground mb-2'>Utilities</h1>
        <p className='text-muted-foreground text-lg'>
          Admin tools for notifications, reports, and template management.
        </p>
      </div>

      <div className='p-8'>
        <Tabs defaultValue='notifications' className='w-full'>
          <TabsList className='mb-6 inline-flex h-12 w-auto items-center gap-1 rounded-xl bg-muted/80 p-1.5'>
            <TabsTrigger
              value='notifications'
              className='h-9 gap-2 rounded-lg px-5 text-sm font-medium text-foreground/80 shadow-none hover:bg-background/65 hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm'
            >
              <Bell className='h-4 w-4' />
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value='reports'
              className='h-9 gap-2 rounded-lg px-5 text-sm font-medium text-foreground/80 shadow-none hover:bg-background/65 hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm'
            >
              <BarChart3 className='h-4 w-4' />
              Reports
            </TabsTrigger>
            <TabsTrigger
              value='templates'
              className='h-9 gap-2 rounded-lg px-5 text-sm font-medium text-foreground/80 shadow-none hover:bg-background/65 hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm'
            >
              <PenTool className='h-4 w-4' />
              Template Editor
            </TabsTrigger>
          </TabsList>

          <TabsContent value='notifications'>
            <NotificationsPanel />
          </TabsContent>

          <TabsContent value='reports'>
            <ReportsPanel />
          </TabsContent>

          <TabsContent value='templates'>
            <TemplateEditorPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
