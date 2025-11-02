# Design Document: User Management and Role-Based Access Control

## Overview

This design document outlines the implementation of a comprehensive hierarchical RBAC system for the IND Manager V2 platform. The system enables fine-grained permission management across projects, modules, folders, and documents with cascading ownership and role inheritance.

The design extends the existing architecture by introducing new database tables, API endpoints, Redux state management, and UI components to support system-level administration, project-level ownership, and hierarchical permission inheritance.

## Architecture

### High-Level Architecture

The RBAC system follows a layered architecture pattern consistent with the existing IND Manager V2 system:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                            │
│  • User Management UI (System Admin)                                │
│  • Project Settings UI (Project Admin)                              │
│  • Permission Management UI (Module/Folder Owners)                  │
│  • Role Indicators & Access Controls                                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        STATE MANAGEMENT                              │
│  • usersSlice (System Admin operations)                             │
│  • projectsSlice (Project membership & roles)                       │
│  • permissionsSlice (Role assignments & inheritance)                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API LAYER                                     │
│  • /api/admin/users (CRUD operations)                               │
│  • /api/projects/[id]/members (Membership management)               │
│  • /api/permissions (Role assignment & inheritance)                 │
│  • /api/permissions/check (Permission validation)                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                    │
│  • users (Extended with system_role, status)                        │
│  • projects (Extended with owner_id)                                │
│  • project_members (New: membership tracking)                       │
│  • modules (New: module definitions)                                │
│  • folders (New: hierarchical structure)                            │
│  • item_permissions (New: role assignments)                         │
│  • RLS Policies (Permission enforcement)                            │
└─────────────────────────────────────────────────────────────────────┘
```

### Permission Resolution Flow

```
User attempts action on item (document/folder/module)
                    │
                    ▼
┌──────────────────────────────────────────────┐
│  Check explicit permission on item           │
└──────────────────────────────────────────────┘
                    │
                    ├─── Found? ──► Apply explicit role
                    │
                    ▼ Not found
┌──────────────────────────────────────────────┐
│  Traverse up hierarchy to parent             │
└──────────────────────────────────────────────┘
                    │
                    ├─── Found? ──► Apply inherited role
                    │
                    ▼ Not found
┌──────────────────────────────────────────────┐
│  Check project membership default role       │
└──────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────┐
│  Return effective role (or deny access)      │
└──────────────────────────────────────────────┘
```

## Components and Interfaces

### Database Schema

#### Extended Users Table

```sql
-- Extend existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS system_role TEXT DEFAULT 'regular_user' 
  CHECK (system_role IN ('system_admin', 'project_admin', 'regular_user'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
  CHECK (status IN ('active', 'inactive'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
```

#### Projects Table Extension

```sql
-- Extend existing projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
```

#### New Tables

```sql
-- Project membership tracking
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  default_role TEXT NOT NULL DEFAULT 'viewer' 
    CHECK (default_role IN ('owner', 'editor', 'reviewer', 'viewer')),
  added_by UUID REFERENCES users(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Module definitions (5 standard modules per project)
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  module_number INTEGER NOT NULL CHECK (module_number BETWEEN 1 AND 5),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, module_number)
);

-- Hierarchical folder structure
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT NOT NULL, -- Materialized path for efficient queries
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unified permission assignments for all item types
CREATE TABLE item_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('project', 'module', 'folder', 'document')),
  item_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'reviewer', 'viewer')),
  is_inherited BOOLEAN DEFAULT FALSE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

-- Audit log for permission changes
CREATE TABLE permission_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL CHECK (action IN ('assign', 'remove', 'transfer', 'override')),
  item_type TEXT NOT NULL,
  item_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  previous_role TEXT,
  new_role TEXT,
  performed_by UUID NOT NULL REFERENCES users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Endpoints

#### System Admin APIs

```typescript
// /app/api/admin/users/route.ts
GET    /api/admin/users              // List all users
POST   /api/admin/users              // Create new user
PUT    /api/admin/users/[id]         // Update user (role, status)
DELETE /api/admin/users/[id]         // Delete user (with validation)

// /app/api/admin/users/[id]/ownership/route.ts
GET    /api/admin/users/[id]/ownership  // Get all items owned by user
```

#### Project Management APIs

```typescript
// /app/api/projects/route.ts
POST   /api/projects                 // Create project (Project Admin only)

// /app/api/projects/[id]/members/route.ts
GET    /api/projects/[id]/members    // List project members
POST   /api/projects/[id]/members    // Add member to project
PUT    /api/projects/[id]/members/[userId]  // Update member role
DELETE /api/projects/[id]/members/[userId]  // Remove member

// /app/api/projects/[id]/modules/route.ts
GET    /api/projects/[id]/modules    // List modules with owners
PUT    /api/projects/[id]/modules/[moduleId]/owner  // Assign module owner
```

#### Permission Management APIs

```typescript
// /app/api/permissions/route.ts
POST   /api/permissions              // Assign role to user on item
DELETE /api/permissions              // Remove role assignment

// /app/api/permissions/check/route.ts
POST   /api/permissions/check        // Check if user has permission
  // Body: { userId, itemType, itemId, requiredRole }

// /app/api/permissions/effective/route.ts
GET    /api/permissions/effective    // Get effective role for user on item
  // Query: ?userId=xxx&itemType=xxx&itemId=xxx

// /app/api/permissions/inherit/route.ts
POST   /api/permissions/inherit      // Recalculate inheritance for item tree
```

### Redux State Management

#### Users Slice

```typescript
// lib/store/slices/usersSlice.ts
interface UsersState {
  users: User[];
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  system_role: 'system_admin' | 'project_admin' | 'regular_user';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// Actions
- fetchUsers()
- createUser(userData)
- updateUser(id, updates)
- deleteUser(id)
- checkUserOwnership(userId)
```

#### Projects Slice Extension

```typescript
// lib/store/slices/projectsSlice.ts (extended)
interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  members: ProjectMember[];
  modules: Module[];
  loading: boolean;
  error: string | null;
}

interface Project {
  id: string;
  name: string;
  owner_id: string;
  // ... existing fields
}

interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  user: User;
  default_role: Role;
  added_by: string;
  added_at: string;
}

interface Module {
  id: string;
  project_id: string;
  module_number: number;
  name: string;
  owner_id: string | null;
  owner?: User;
}

// Actions
- fetchProjectMembers(projectId)
- addProjectMember(projectId, userId, role)
- updateMemberRole(projectId, userId, role)
- removeMember(projectId, userId)
- assignModuleOwner(projectId, moduleId, userId)
```

#### Permissions Slice (New)

```typescript
// lib/store/slices/permissionsSlice.ts
interface PermissionsState {
  permissions: ItemPermission[];
  effectivePermissions: Map<string, Role>; // key: userId-itemType-itemId
  loading: boolean;
  error: string | null;
}

interface ItemPermission {
  id: string;
  user_id: string;
  item_type: 'project' | 'module' | 'folder' | 'document';
  item_id: string;
  role: Role;
  is_inherited: boolean;
  assigned_by: string;
  assigned_at: string;
}

type Role = 'owner' | 'editor' | 'reviewer' | 'viewer';

// Actions
- assignPermission(userId, itemType, itemId, role)
- removePermission(userId, itemType, itemId)
- checkPermission(userId, itemType, itemId, requiredRole)
- getEffectiveRole(userId, itemType, itemId)
- recalculateInheritance(itemType, itemId)
```

### React Components

#### System Admin Components

```typescript
// components/admin/UserManagementTable.tsx
- Display all users with system roles and status
- Create, edit, deactivate users
- View user ownership before deletion

// components/admin/UserForm.tsx
- Form for creating/editing users
- System role selection
- Status toggle

// components/admin/UserOwnershipDialog.tsx
- Display all items owned by a user
- Reassignment interface before deletion
```

#### Project Admin Components

```typescript
// components/projects/ProjectMembersTable.tsx
- Display project members with roles
- Add/remove members
- Update default roles

// components/projects/ModuleOwnershipPanel.tsx
- Display 5 modules with current owners
- Assign/reassign module owners
- Visual indicators for unassigned modules

// components/projects/ProjectSettingsDialog.tsx
- Project-level settings
- Transfer project ownership
```

#### Permission Management Components

```typescript
// components/permissions/RoleAssignmentDialog.tsx
- Assign roles to users for specific items
- Show inherited vs explicit roles
- Override inheritance option

// components/permissions/PermissionIndicator.tsx
- Display user's effective role on an item
- Show inheritance chain
- Visual badges (Owner, Editor, Reviewer, Viewer)

// components/permissions/FolderPermissionsPanel.tsx
- Manage permissions for folder and descendants
- Bulk role assignment
- Inheritance visualization
```

## Data Models

### Permission Hierarchy Model

```typescript
interface PermissionHierarchy {
  project: {
    id: string;
    owner: User;
    members: ProjectMember[];
    modules: ModuleNode[];
  };
}

interface ModuleNode {
  id: string;
  module_number: number;
  name: string;
  owner: User | null;
  folders: FolderNode[];
  permissions: ItemPermission[];
}

interface FolderNode {
  id: string;
  name: string;
  path: string;
  parent_id: string | null;
  children: FolderNode[];
  documents: DocumentNode[];
  permissions: ItemPermission[];
}

interface DocumentNode {
  id: string;
  name: string;
  folder_id: string;
  permissions: ItemPermission[];
}
```

### Permission Resolution Algorithm

```typescript
function getEffectiveRole(
  userId: string,
  itemType: string,
  itemId: string
): Role | null {
  // 1. Check for explicit permission on the item
  const explicitPermission = findExplicitPermission(userId, itemType, itemId);
  if (explicitPermission) {
    return explicitPermission.role;
  }

  // 2. Traverse up the hierarchy to find inherited permission
  const inheritedRole = findInheritedRole(userId, itemType, itemId);
  if (inheritedRole) {
    return inheritedRole;
  }

  // 3. Check project membership default role
  const projectId = getProjectIdForItem(itemType, itemId);
  const membership = findProjectMembership(userId, projectId);
  if (membership) {
    return membership.default_role;
  }

  // 4. No access
  return null;
}

function findInheritedRole(
  userId: string,
  itemType: string,
  itemId: string
): Role | null {
  const parent = getParentItem(itemType, itemId);
  if (!parent) return null;

  const parentPermission = findExplicitPermission(
    userId,
    parent.type,
    parent.id
  );
  if (parentPermission) {
    return parentPermission.role;
  }

  // Recursively check parent's parent
  return findInheritedRole(userId, parent.type, parent.id);
}
```

## Error Handling

### Validation Errors

```typescript
class PermissionError extends Error {
  constructor(
    public code: string,
    public message: string,
    public details?: any
  ) {
    super(message);
  }
}

// Error codes
const ErrorCodes = {
  INSUFFICIENT_PERMISSIONS: 'insufficient_permissions',
  INVALID_ROLE: 'invalid_role',
  MODULE_OWNER_EXISTS: 'module_owner_exists',
  ORPHANED_CONTENT: 'orphaned_content',
  USER_HAS_OWNERSHIP: 'user_has_ownership',
  INVALID_HIERARCHY: 'invalid_hierarchy',
};
```

### Error Handling Strategy

1. **API Level**: Validate permissions before executing operations
2. **Database Level**: Use constraints and triggers to prevent invalid states
3. **UI Level**: Disable actions user doesn't have permission for
4. **Audit Level**: Log all permission changes for compliance

## Testing Strategy

### Unit Tests

```typescript
// Permission resolution logic
describe('getEffectiveRole', () => {
  test('returns explicit role when assigned');
  test('returns inherited role from parent');
  test('returns project default role');
  test('returns null when no access');
  test('prefers explicit over inherited');
});

// Ownership transfer
describe('transferOwnership', () => {
  test('updates owner and downgrades previous owner');
  test('cascades to descendants');
  test('preserves explicit child permissions');
});
```

### Integration Tests

```typescript
// API endpoint tests
describe('POST /api/permissions', () => {
  test('assigns role with proper authorization');
  test('rejects unauthorized assignment');
  test('validates role hierarchy constraints');
});

// Database constraint tests
describe('Module ownership constraints', () => {
  test('prevents multiple owners per module');
  test('prevents orphaned modules');
});
```

### E2E Tests

```typescript
// User workflows
describe('Project Admin workflow', () => {
  test('create project and assign module owners');
  test('add members with different roles');
  test('override folder permissions');
});

describe('Module Owner workflow', () => {
  test('assign subfolder owner');
  test('manage collaborator roles');
  test('cannot assign outside module');
});
```

## Security Considerations

### Row-Level Security Policies

```sql
-- Users table: System Admins can see all, others see active only
CREATE POLICY users_select_policy ON users
  FOR SELECT USING (
    status = 'active' OR
    auth.uid() IN (SELECT id FROM users WHERE system_role = 'system_admin')
  );

-- Project members: Can only see members of projects they belong to
CREATE POLICY project_members_select_policy ON project_members
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    ) OR
    auth.uid() IN (SELECT id FROM users WHERE system_role = 'system_admin')
  );

-- Item permissions: Can only see permissions for items they have access to
CREATE POLICY item_permissions_select_policy ON item_permissions
  FOR SELECT USING (
    user_id = auth.uid() OR
    has_permission(auth.uid(), item_type, item_id, 'viewer')
  );
```

### Permission Check Function

```sql
CREATE OR REPLACE FUNCTION has_permission(
  check_user_id UUID,
  check_item_type TEXT,
  check_item_id UUID,
  required_role TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  effective_role TEXT;
  role_hierarchy TEXT[] := ARRAY['viewer', 'reviewer', 'editor', 'owner'];
  required_level INT;
  effective_level INT;
BEGIN
  -- Get effective role using hierarchy traversal
  effective_role := get_effective_role(check_user_id, check_item_type, check_item_id);
  
  IF effective_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Compare role levels
  required_level := array_position(role_hierarchy, required_role);
  effective_level := array_position(role_hierarchy, effective_role);
  
  RETURN effective_level >= required_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Performance Optimization

### Caching Strategy

1. **Effective Permissions Cache**: Cache computed effective roles in Redis
2. **Hierarchy Path Cache**: Materialize folder paths for quick traversal
3. **Permission Invalidation**: Clear cache on permission changes

### Database Indexes

```sql
-- Optimize permission lookups
CREATE INDEX idx_item_permissions_user_item ON item_permissions(user_id, item_type, item_id);
CREATE INDEX idx_item_permissions_item ON item_permissions(item_type, item_id);

-- Optimize hierarchy traversal
CREATE INDEX idx_folders_parent ON folders(parent_id);
CREATE INDEX idx_folders_path ON folders USING gin(path gin_trgm_ops);

-- Optimize project membership queries
CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_project_members_project ON project_members(project_id);
```

### Query Optimization

```typescript
// Batch permission checks
async function checkPermissionsBatch(
  userId: string,
  items: Array<{ type: string; id: string }>
): Promise<Map<string, Role | null>> {
  // Single query to fetch all relevant permissions
  const permissions = await supabase
    .from('item_permissions')
    .select('*')
    .eq('user_id', userId)
    .in('item_id', items.map(i => i.id));

  // Resolve effective roles in memory
  return items.reduce((map, item) => {
    const key = `${item.type}-${item.id}`;
    map.set(key, resolveEffectiveRole(userId, item, permissions));
    return map;
  }, new Map());
}
```

## Migration Strategy

### Phase 1: Database Schema
1. Create new tables (modules, folders, item_permissions, etc.)
2. Add columns to existing tables (users.system_role, projects.owner_id)
3. Create RLS policies and helper functions

### Phase 2: Data Migration
1. Migrate existing team roles to system roles
2. Create default modules for existing projects
3. Migrate document_roles to item_permissions
4. Set default project memberships

### Phase 3: API Implementation
1. Implement admin APIs
2. Implement project management APIs
3. Implement permission APIs
4. Add permission checks to existing APIs

### Phase 4: Frontend Implementation
1. Build admin UI components
2. Build project settings UI
3. Build permission management UI
4. Update existing components with permission checks

### Phase 5: Testing & Rollout
1. Run comprehensive test suite
2. Perform load testing
3. Gradual rollout with feature flags
4. Monitor and iterate
