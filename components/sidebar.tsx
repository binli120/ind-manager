// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  BarChart3,
  Brain,
  Building2Icon,
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageSquare,
  Palette,
  Search,
  Upload,
  UserIcon,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({
  isOpen,
  onToggle,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems = [
    {
      icon: FileText,
      label: 'Document Authoring',
      path: '/workspace/ind_editor',
    },
    {
      icon: MessageSquare,
      label: 'Review Center',
      path: '/workspace/document_review',
    },
    {
      icon: AlertTriangle,
      label: 'Gap Analysis',
      path: '/workspace/gap_analysis',
    },
  ];

  const teamItems = [
    {
      icon: FileText,
      label: 'Projects',
      path: '/projects',
    },
    {
      icon: Calendar,
      label: 'Calendar',
      path: '/calendar',
    },
  ];

  const submissionItems = [
    {
      icon: Upload,
      label: 'IND Submission',
      path: '/submission/IND',
    },
    {
      icon: CheckSquare,
      label: 'Acknowledge',
      path: '/submission/acknowledge',
    },
    {
      icon: FileText,
      label: 'Post Submission',
      path: '/submission/post',
    },
  ];

  const adminItems = [
    {
      title: 'Tenants',
      icon: Building2Icon,
      label: 'tenants',
      path: '/admin/tenants',
    },
    {
      title: 'Users',
      icon: UserIcon,
      label: 'users',
      path: '/admin/users',
    },
  ];

  const analysisItems = [
    {
      icon: BarChart3,
      label: 'Gap Scoring',
      path: '/analysis/gap_scoring',
    },
  ];

  const designItems = [
    {
      icon: Palette,
      label: 'Design System',
      path: '/design/system',
    },
  ];

  return (
    <div
      className={cn(
        'bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col',
        isOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className='p-4 border-b border-sidebar-border flex items-center justify-between gap-3'>
        <div className='flex items-center gap-3 flex-1 min-w-0'>
          <div className='relative'>
            <div className='w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center shadow-sm'>
              <Brain className='w-4 h-4 text-white' />
            </div>
            <div className='absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white'></div>
          </div>
          {isOpen && (
            <div className='flex flex-col'>
              <span className='font-bold text-lg text-sidebar-foreground leading-none'>
                FilynAI
              </span>
              <span className='text-xs text-muted font-medium'>
                Regulatory Intelligence
              </span>
            </div>
          )}
        </div>
        <Button
          variant='ghost'
          size='icon'
          onClick={onToggle}
          className='h-8 w-8 text-muted-foreground hover:text-foreground'
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? (
            <ChevronLeft className='h-4 w-4' />
          ) : (
            <ChevronRight className='h-4 w-4' />
          )}
        </Button>
      </div>

      {/* Search */}
      {isOpen && (
        <div className='p-4'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted' />
            <Input
              placeholder='Search...'
              className='pl-10 bg-sidebar-primary border-sidebar-border'
            />
          </div>
        </div>
      )}

      <div className='flex-1 overflow-y-auto'>
        {/* Team Space */}
        <div className='p-4'>
          {isOpen && (
            <h3 className='text-xs font-semibold text-muted uppercase tracking-wider mb-3'>
              Workspace
            </h3>
          )}
          <nav className='space-y-1'>
            {navigationItems.map((item) => (
              <Button
                key={item.label}
                variant={item.path === pathname ? 'secondary' : 'ghost'}
                onClick={() => router.push(item.path)}
                className={cn(
                  'w-full justify-start gap-3 h-10',
                  !isOpen && 'justify-center px-2',
                  item.path === pathname &&
                    'bg-sidebar-primary text-sidebar-primary-foreground'
                )}
              >
                <item.icon className='w-4 h-4 flex-shrink-0' />
                {isOpen && (
                  <span className='flex-1 text-left'>{item.label}</span>
                )}
              </Button>
            ))}
          </nav>
        </div>

        <div className='p-4'>
          {isOpen && (
            <h3 className='text-xs font-semibold text-muted uppercase tracking-wider mb-3'>
              Team Space
            </h3>
          )}
          <nav className='space-y-1'>
            {teamItems.map((item) => (
              <Button
                key={item.label}
                variant={item.path === pathname ? 'secondary' : 'ghost'}
                onClick={() => router.push(item.path)}
                className={cn(
                  'w-full justify-start gap-3 h-10',
                  !isOpen && 'justify-center px-2',
                  item.path === pathname &&
                    'bg-sidebar-primary text-sidebar-primary-foreground'
                )}
              >
                <item.icon className='w-4 h-4 flex-shrink-0' />
                {isOpen && (
                  <>
                    <span className='flex-1 text-left'>{item.label}</span>
                  </>
                )}
              </Button>
            ))}
          </nav>
        </div>

        {/* Admin Management */}
        <div className='p-4'>
          {isOpen && (
            <h3 className='text-xs font-semibold text-muted uppercase tracking-wider mb-3'>
              Admin Space
            </h3>
          )}
          <nav className='space-y-1'>
            {adminItems.map((item) => (
              <Button
                key={item.label}
                variant={item.path === pathname ? 'secondary' : 'ghost'}
                onClick={() => router.push(item.path)}
                className={cn(
                  'w-full justify-start gap-3 h-10',
                  !isOpen && 'justify-center px-2',
                  item.path === pathname &&
                    'bg-sidebar-primary text-sidebar-primary-foreground'
                )}
              >
                <item.icon className='w-4 h-4 flex-shrink-0' />
                {isOpen && (
                  <span className='flex-1 text-left'>{item.label}</span>
                )}
              </Button>
            ))}
          </nav>
        </div>

        {/* Submission Management */}
        <div className='p-4'>
          {isOpen && (
            <h3 className='text-xs font-semibold text-muted uppercase tracking-wider mb-3'>
              Submission Management
            </h3>
          )}
          <nav className='space-y-1'>
            {submissionItems.map((item) => (
              <Button
                key={item.label}
                variant={item.path === pathname ? 'secondary' : 'ghost'}
                onClick={() => router.push(item.path)}
                className={cn(
                  'w-full justify-start gap-3 h-10',
                  !isOpen && 'justify-center px-2',
                  item.path === pathname &&
                    'bg-sidebar-primary text-sidebar-primary-foreground'
                )}
              >
                <item.icon className='w-4 h-4 flex-shrink-0' />
                {isOpen && (
                  <span className='flex-1 text-left'>{item.label}</span>
                )}
              </Button>
            ))}
          </nav>
        </div>

        {/* AI Analysis */}
        <div className='p-4'>
          {isOpen && (
            <h3 className='text-xs font-semibold text-muted uppercase tracking-wider mb-3'>
              AI Analysis
            </h3>
          )}
          <nav className='space-y-1'>
            {analysisItems.map((item) => (
              <Button
                key={item.label}
                variant={item.path === pathname ? 'secondary' : 'ghost'}
                onClick={() => router.push(item.path)}
                className={cn(
                  'w-full justify-start gap-3 h-10',
                  !isOpen && 'justify-center px-2',
                  item.path === pathname &&
                    'bg-sidebar-primary text-sidebar-primary-foreground'
                )}
              >
                <item.icon className='w-4 h-4 flex-shrink-0' />
                {isOpen && (
                  <span className='flex-1 text-left'>{item.label}</span>
                )}
              </Button>
            ))}
          </nav>
        </div>

        <div className='p-4'>
          {isOpen && (
            <h3 className='text-xs font-semibold text-muted uppercase tracking-wider mb-3'>
              Design
            </h3>
          )}
          <nav className='space-y-1'>
            {designItems.map((item) => (
              <Button
                key={item.label}
                variant={item.path === pathname ? 'secondary' : 'ghost'}
                onClick={() => router.push(item.path)}
                className={cn(
                  'w-full justify-start gap-3 h-10',
                  !isOpen && 'justify-center px-2',
                  item.path === pathname &&
                    'bg-sidebar-primary text-sidebar-primary-foreground'
                )}
              >
                <item.icon className='w-4 h-4 flex-shrink-0' />
                {isOpen && (
                  <span className='flex-1 text-left'>{item.label}</span>
                )}
              </Button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
