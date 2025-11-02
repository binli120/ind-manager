# Requirements Document

## Introduction

This document defines the requirements for implementing a comprehensive User Management and Role-Based Access Control (RBAC) system for the IND Manager V2 platform. The system enables hierarchical permission management across projects, modules, folders, and documents with cascading ownership and role inheritance.

## Glossary

- **System**: The IND Manager V2 platform
- **User**: An authenticated account holder on the platform
- **Project**: A workspace container for managing a single IND or IND sequence
- **Module**: A top-level organizational container within a project (Regulatory, CMC, Nonclinical, Clinical)
- **Folder**: A hierarchical container organizing documents within modules
- **Document**: A controlled file stored within the project hierarchy
- **System Admin**: A user with platform-wide administrative privileges
- **Project Admin**: A user who owns and manages a specific project
- **Module Owner**: A user who owns and manages a specific module within a project
- **Subfolder Owner**: A user who owns and manages a specific folder within a module
- **Editor**: A user who can create and edit content but cannot manage roles
- **Reviewer**: A user who can read and comment on content
- **Viewer**: A user who has read-only access to content
- **Inheritance**: The automatic propagation of permissions from parent to child items
- **Explicit Role**: A role directly assigned to a user for a specific item
- **Inherited Role**: A role automatically applied based on parent item permissions
- **Active User**: A user account with status set to Active
- **Inactive User**: A user account with status set to Inactive

## Requirements

### Requirement 1: System Role Management

**User Story:** As a System Admin, I want to manage user accounts and assign system-level roles, so that I can control platform access and administrative capabilities.

#### Acceptance Criteria

1. WHEN a System Admin creates a new user account, THE System SHALL store the user's name, email, and status (Active/Inactive)
2. WHEN a System Admin assigns a system role to a user, THE System SHALL restrict the assignment to exactly one of: Regular User or Project Admin
3. WHEN a System Admin views the user list, THE System SHALL display all users with their current system roles and status
4. WHEN a System Admin deactivates a user account, THE System SHALL set the user status to Inactive and prevent login
5. WHEN a System Admin attempts to delete a user who owns project items, THE System SHALL prevent deletion and display a message indicating ownership reassignment is required

### Requirement 2: Project Creation and Ownership

**User Story:** As a Project Admin, I want to create projects and manage their membership, so that I can organize IND submission work and control team access.

#### Acceptance Criteria

1. WHEN a Project Admin creates a new project, THE System SHALL assign the creator as the Project Owner with full project-level permissions
2. WHEN a Project Admin creates a project, THE System SHALL initialize five default modules: Module 1 (Administrative), Module 2 (Regulatory), Module 3 (CMC), Module 4 (Nonclinical), and Module 5 (Clinical)
3. WHEN a Project Admin adds a user to a project without specifying a module, THE System SHALL assign the user a Viewer role across all project content
4. WHEN a Project Admin assigns a user as Module Owner, THE System SHALL grant that user Owner permissions for the specified module and all its descendants
5. WHEN a Project Admin views project membership, THE System SHALL display all members with their assigned roles and module ownership

### Requirement 3: Module Ownership Assignment

**User Story:** As a Project Admin, I want to assign exactly one Module Owner per module, so that clear responsibility and authority exist for each regulatory section.

#### Acceptance Criteria

1. WHEN a Project Admin assigns a Module Owner to a module, THE System SHALL verify that no other user currently owns that module
2. WHEN a Module Owner is assigned to a module, THE System SHALL automatically grant Owner permissions to all folders and documents within that module through inheritance
3. WHEN a Project Admin reassigns module ownership from User A to User B, THE System SHALL downgrade User A's role to Viewer for that module and its descendants
4. WHEN a Project Admin attempts to remove a Module Owner without assigning a replacement, THE System SHALL prevent the removal and display a message requiring ownership reassignment
5. WHEN a module has no assigned Owner, THE System SHALL display a warning indicator to the Project Admin

### Requirement 4: Hierarchical Permission Inheritance

**User Story:** As a Module Owner, I want permissions to cascade automatically to child items, so that I don't need to manually assign roles at every level.

#### Acceptance Criteria

1. WHEN a user is assigned a role on a folder, THE System SHALL automatically apply that role to all child folders and documents unless explicitly overridden
2. WHEN a Module Owner creates a new subfolder, THE System SHALL inherit the Module Owner's ownership to the new subfolder
3. WHEN a Subfolder Owner is explicitly assigned, THE System SHALL override inherited ownership for that folder and its descendants
4. WHEN an explicit role is removed from an item, THE System SHALL revert to the inherited role from the parent item
5. WHEN calculating effective permissions for a user on an item, THE System SHALL apply the most permissive role between explicit and inherited assignments

### Requirement 5: Role-Based Access Control

**User Story:** As a user with project access, I want my permissions to match my assigned role, so that I can perform appropriate actions without exceeding my authority.

#### Acceptance Criteria

1. WHEN a user has the Owner role on an item, THE System SHALL allow the user to edit content, transfer ownership, assign roles, and manage inheritance
2. WHEN a user has the Editor role on an item, THE System SHALL allow the user to create and edit content but prevent role management actions
3. WHEN a user has the Reviewer role on an item, THE System SHALL allow the user to read content and add comments but prevent editing
4. WHEN a user has the Viewer role on an item, THE System SHALL allow the user to read content but prevent commenting or editing
5. WHEN a user attempts an action not permitted by their role, THE System SHALL deny the action and display an appropriate permission error message

### Requirement 6: Subfolder and Document Role Management

**User Story:** As a Module Owner, I want to assign Subfolder Owners and collaborator roles within my module, so that I can delegate management responsibilities appropriately.

#### Acceptance Criteria

1. WHEN a Module Owner assigns a Subfolder Owner, THE System SHALL grant Owner permissions to that user for the specified folder and its descendants
2. WHEN a Module Owner assigns an Editor, Reviewer, or Viewer role to a user for a folder, THE System SHALL apply that role to the folder and its descendants through inheritance
3. WHEN a Subfolder Owner assigns roles, THE System SHALL restrict assignments to folders one level below their owned folder
4. WHEN a document is created within a folder, THE System SHALL inherit the folder's Owner as the document Owner unless explicitly reassigned
5. WHEN a Module Owner views the role assignment interface, THE System SHALL display all current assignments within their module with inheritance indicators

### Requirement 7: Project Admin Override Authority

**User Story:** As a Project Admin, I want to override or reassign ownership and roles at any level, so that I can resolve conflicts and maintain project integrity.

#### Acceptance Criteria

1. WHEN a Project Admin views any module, folder, or document, THE System SHALL display current ownership and role assignments
2. WHEN a Project Admin reassigns ownership at any level, THE System SHALL update the ownership and cascade changes to descendants according to inheritance rules
3. WHEN a Project Admin overrides a role assignment, THE System SHALL create an explicit role that takes precedence over inherited permissions
4. WHEN a Project Admin removes a role override, THE System SHALL revert to inherited permissions from the parent item
5. WHEN a Project Admin performs an override action, THE System SHALL log the action with timestamp and admin identifier for audit purposes

### Requirement 8: User Removal and Ownership Transfer

**User Story:** As a System Admin, I want to safely remove or deactivate users, so that I can manage the user base without creating orphaned content.

#### Acceptance Criteria

1. WHEN a System Admin attempts to deactivate a user who owns project items, THE System SHALL display a list of all owned items requiring reassignment
2. WHEN a System Admin reassigns all owned items from a user, THE System SHALL verify that all new owners are Active users
3. WHEN a user is deactivated, THE System SHALL set their status to Inactive and revoke all project access immediately
4. WHEN a deactivated user is reactivated, THE System SHALL restore their status to Active but require explicit project membership reassignment
5. WHEN a System Admin completes user removal, THE System SHALL verify that no items remain owned by the removed user

### Requirement 9: System Admin Project Visibility

**User Story:** As a System Admin, I want to view all projects and user assignments without modifying content, so that I can monitor platform usage and resolve access issues.

#### Acceptance Criteria

1. WHEN a System Admin accesses the projects list, THE System SHALL display all projects with their Project Admins and member counts
2. WHEN a System Admin views a project's details, THE System SHALL display all members, their roles, and module ownership assignments
3. WHEN a System Admin attempts to edit project content without being a project member, THE System SHALL prevent the modification and display a permission message
4. WHEN a System Admin views project content, THE System SHALL display the content in read-only mode with no edit controls
5. WHEN a System Admin is added as a project member, THE System SHALL grant them the assigned role permissions like any other user

### Requirement 10: Permission Resolution and Conflict Handling

**User Story:** As a user with multiple role assignments, I want the system to apply the most permissive role, so that I can access content appropriately when roles overlap.

#### Acceptance Criteria

1. WHEN a user has both an explicit role and an inherited role on an item, THE System SHALL apply the explicit role
2. WHEN a user has multiple inherited roles from different parent paths, THE System SHALL apply the most permissive role
3. WHEN determining the most permissive role, THE System SHALL rank roles in order: Owner > Editor > Reviewer > Viewer
4. WHEN a user's effective role changes due to inheritance updates, THE System SHALL recalculate permissions immediately without requiring logout
5. WHEN displaying a user's role on an item, THE System SHALL indicate whether the role is explicit or inherited
