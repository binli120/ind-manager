// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';

import { Sidebar } from './sidebar';

const meta: Meta<typeof Sidebar> = {
  title: 'Components/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    isOpen: true,
    view: 'workspace',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const SidebarPreview: React.FC<React.ComponentProps<typeof Sidebar>> = (
  props
) => {
  const [isOpen, setIsOpen] = React.useState(props.isOpen);

  return (
    <div className='flex h-screen bg-muted/10'>
      <Sidebar
        {...props}
        isOpen={isOpen}
        view={props.view}
        onToggle={() => setIsOpen((prev) => !prev)}
      />
      <div className='flex-1 flex flex-col items-center justify-center text-sm text-muted-foreground'>
        <p>Current view: {props.view}</p>
        <p>{isOpen ? 'Sidebar expanded' : 'Sidebar collapsed'}</p>
      </div>
    </div>
  );
};

export const Default: Story = {
  render: (args) => <SidebarPreview {...args} />,
};

export const Collapsed: Story = {
  args: {
    isOpen: false,
  },
  render: (args) => <SidebarPreview {...args} />,
};
