// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

const dispatchMock = jest.fn();
const setProjectMock = jest.fn();
const mockState = {
  auth: {
    user: { id: 'u1', email: 'a@b.com' },
    isAuthenticated: true,
    isLoading: false,
    error: null as string | null,
    session: null,
  },
  ui: { sidebarOpen: true, commentsPanelOpen: false, currentView: 'workspace' as const },
  projects: {
    projects: [] as Array<{ id: string; title: string }>,
    currentProject: null,
    selectedProjectId: 'p1',
    isLoading: false,
    hasLoadedOnce: true,
    error: null as string | null,
    filters: { search: '', status: 'all', priority: 'all' },
    viewMode: 'grid' as const,
  },
  documents: { selectedDocumentId: null as string | null },
  tenants: {
    tenants: [] as Array<{ id: string; name: string }>,
    currentTenant: null,
    selectedTenantId: null as string | null,
    isLoading: false,
    error: null as string | null,
  },
  notifications: {
    items: [] as unknown[],
    unread: 0,
    loading: false,
    error: null as string | null,
    isOpen: false,
  },
};

jest.mock('@/lib/store', () => ({
  useAppDispatch: () => dispatchMock,
  useAppSelector: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));

jest.mock('@/hooks/useProject', () => ({
  useProject: () => ({
    projects: [
      {
        id: 'p1',
        title: 'Alpha Project',
      },
    ],
    currentProject: null,
    selectedProjectId: 'p1',
    isLoading: false,
    error: null,
    setProject: setProjectMock,
  }),
}));

jest.mock('@/lib/supabase', () => ({
  createBrowserClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.com' } } }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  }),
}));

jest.mock('react-redux', () => ({
  useDispatch: () => dispatchMock,
  useSelector: (fn: (state: typeof mockState) => unknown) => fn(mockState),
}));

jest.mock('@/components/ui/select', () => {
  const SelectContext = React.createContext<{ onValueChange?: (val: string) => void }>({});

  type SelectProps = { children: React.ReactNode; onValueChange?: (val: string) => void };
  const Select = ({ children, onValueChange }: SelectProps) => (
    <SelectContext.Provider value={{ onValueChange }}>
      <div>{children}</div>
    </SelectContext.Provider>
  );

  type SimpleProps = { children: React.ReactNode };
  const SelectTrigger = ({ children }: SimpleProps) => (
    <button role="combobox" aria-expanded="false" aria-controls="mock-select-content">
      {children}
    </button>
  );
  const SelectContent = ({ children }: SimpleProps) => (
    <div id="mock-select-content">{children}</div>
  );

  type ItemProps = { value: string; children: React.ReactNode };
  const SelectItem = ({ value, children }: ItemProps) => {
    const ctx = React.useContext(SelectContext);
    return (
      <div
        role="option"
        aria-selected="false"
        onClick={() => ctx.onValueChange?.(value)}
        data-value={value}
      >
        {children}
      </div>
    );
  };
  const SelectValue = ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>;
  return { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    pathname: '/',
  }),
  usePathname: () => '/workspace',
  useSearchParams: () => new URLSearchParams(),
}));

import { Header } from '@/components/header';

describe('Header project dropdown', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
    setProjectMock.mockClear();
  });

  it('renders label and allows selecting a project', async () => {
    await act(async () => {
      render(
        <Header
          onToggleSidebar={() => {}}
          onToggleComments={() => {}}
          currentView="workspace"
        />,
      );
      await Promise.resolve();
    });

    expect(screen.getByText(/Select project/i)).toBeInTheDocument();

    const trigger = screen.getByText(/Select project/i).closest('button');
    expect(trigger).toBeTruthy();
    fireEvent.click(trigger!);

    const option = screen.getByText('Alpha Project');
    fireEvent.click(option);
    await act(async () => Promise.resolve());

    expect(setProjectMock).toHaveBeenCalledWith('p1');
  });
});
