'use client';

// Author: Bin Lee (blee@filynai.com)
// Description: Renders the compact toolbox shortcuts for quickly launching analysis tools.
import {
  AudioWaveform,
  BarChart3,
  Brain,
  WalletCards as Flashcards,
  HelpCircle,
  Video,
  Wand2,
} from 'lucide-react';
import { SimpleTooltip } from './simple-tooltip';
import { Button } from '../ui/button';

interface MinimizedToolboxProps {
  selectedDocument: string | null;
  onToolSelect?: (toolId: string) => void;
}

export function MinimizedToolbox({
  selectedDocument,
  onToolSelect,
}: MinimizedToolboxProps) {
  const tools = [
    {
      id: 'audio-overview',
      title: 'Audio Overview',
      icon: AudioWaveform,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      id: 'video-overview',
      title: 'Video Overview',
      icon: Video,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      id: 'mind-map',
      title: 'Mind Map',
      icon: Brain,
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: BarChart3,
      color: 'bg-orange-500 hover:bg-orange-600',
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      icon: Flashcards,
      color: 'bg-pink-500 hover:bg-pink-600',
    },
    {
      id: 'quiz',
      title: 'Quiz',
      icon: HelpCircle,
      color: 'bg-indigo-500 hover:bg-indigo-600',
    },
    {
      id: 'ai-assistant',
      title: 'AI Assistant',
      icon: Wand2,
      color: 'bg-cyan-500 hover:bg-cyan-600',
    },
  ];

  return (
    <div className='flex flex-col gap-2 p-2'>
      {tools.map((tool) => {
        const IconComponent = tool.icon;
        return (
          <SimpleTooltip key={tool.id} content={tool.title} side='left'>
            <Button
              size='sm'
              className={`w-10 h-10 p-0 ${tool.color} text-white border-0 ${
                !selectedDocument ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={false}
              onClick={
                !selectedDocument
                  ? undefined
                  : () => {
                      onToolSelect?.(tool.id);
                    }
              }
              title={`HTML Title: ${tool.title}`}
            >
              <IconComponent className='h-5 w-5' />
            </Button>
          </SimpleTooltip>
        );
      })}
    </div>
  );
}
