// Author: Bin Lee
// Email: binlee120@gmail.com

/* ────────────────────────────────────── */
/* Calendar.stories.tsx */
/* ────────────────────────────────────── */

import type { Meta, StoryObj } from '@storybook/react';
import { Calendar, CalendarDayButton } from './calendar';

export default {
  title: 'Components/Calendar',
  component: Calendar,
  tags: ['autodocs'],
  // The following type ensures that the args we expose in the story
  // are exactly the props of `Calendar`.
  // If you add a new prop to the component, it will automatically
  // appear here (or produce a type error if you forget to update the
  // story).
  argTypes: {
    className: { control: 'text' },
    classNames: { control: 'object' },
    showOutsideDays: { control: 'boolean' },
    captionLayout: { control: 'select', options: ['label', 'grid'] },
    buttonVariant: {
      control: 'select',
      options: ['ghost', 'outline', 'default'],
    },
    formatters: { control: false }, // complex object – hide from controls
    components: { control: false }, // custom component overrides
  },
} satisfies Meta<typeof Calendar>;

type Story = StoryObj<typeof Calendar>;

/* ──────────────────────── */
/* Default story (shows the picker) */
export const Default: Story = {
  args: {
    showOutsideDays: true,
    captionLayout: 'label',
    buttonVariant: 'ghost',
  },
};

/* ──────────────────────── */
/* A “range” example – you can see how to pass modifiers via props */
export const RangeSelection: Story = {
  ...Default,
  args: {
    // the `mode` prop is part of DayPicker’s API
    mode: 'range',
    showOutsideDays: false,
  },
};

/* ──────────────────────── */
/* Custom button variant – demonstrates using the `components`
   override to inject a different icon set (optional) */
export const CustomIcons: Story = {
  ...Default,
  args: {
    components: {
      Chevron: ({ orientation, className, ...props }) => {
        // Replace with your own SVG or component
        return (
          <svg
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill={orientation === 'left' ? 'currentColor' : 'none'}
            className={className}
            {...props}
          >
            {/* ...your icon markup... */}
          </svg>
        );
      },
    },
  },
};

/* ──────────────────────── */
/* Show a custom day button (you can tweak styling) */
export const CustomDayButton: Story = {
  ...Default,
  args: {
    components: { DayButton: CalendarDayButton },
  },
};
