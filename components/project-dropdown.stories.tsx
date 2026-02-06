// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ProjectOption = {
  id: string;
  title: string;
};

type ProjectDropdownProps = {
  projects: ProjectOption[];
  label?: string;
};

const ProjectDropdownPreview: React.FC<ProjectDropdownProps> = ({
  projects,
  label = 'Project',
}) => {
  const [selectedId, setSelectedId] = useState<string | undefined>(
    projects[0]?.id,
  );

  const currentLabel = useMemo(
    () => projects.find((p) => p.id === selectedId)?.title || 'Select project',
    [projects, selectedId],
  );

  return (
    <div className="min-h-[200px] bg-background p-6 text-foreground">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold">{label}</span>
        <Select
          value={selectedId}
          onValueChange={(val) => setSelectedId(val)}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem
                key={project.id}
                value={project.id}
                className="!text-gray-900 dark:!text-gray-100"
              >
                {project.title}
              </SelectItem>
            ))}
            {projects.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                No projects found
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
        <span>Selected:</span>
        <strong className="text-foreground">{currentLabel}</strong>
        <Button variant="ghost" size="sm" onClick={() => setSelectedId(undefined)}>
          Clear
        </Button>
      </div>
    </div>
  );
};

const meta: Meta<typeof ProjectDropdownPreview> = {
  title: 'Components/Project Dropdown',
  component: ProjectDropdownPreview,
  args: {
    label: 'Project',
    projects: [
      { id: 'p1', title: 'Alpha Project' },
      { id: 'p2', title: 'Beta Expansion' },
      { id: 'p3', title: 'Gamma Clinical' },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptyState: Story = {
  args: {
    projects: [],
  },
};
