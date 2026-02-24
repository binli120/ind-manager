'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileCode,
  FileJson,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Loader2,
  Pencil,
  Power,
  PowerOff,
  Search,
  Upload,
  XCircle,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

// --- Types ---

type TemplateStatus = 'active' | 'suspended';
type TemplateScope = 'system-default' | 'tenant-project';

interface INDTemplate {
  id: string;
  name: string;
  description: string;
  scope: TemplateScope;
  tenant?: string;
  project?: string;
  version: string;
  lastModified: string;
  status: TemplateStatus;
}

interface WordTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  lastModified: string;
  status: TemplateStatus;
}

// --- Mock Data ---

const indSystemDefaults: INDTemplate[] = [
  {
    id: 'ind-s1',
    name: 'IND Application Form (FDA 1571)',
    description:
      'Standard FDA Form 1571 for Investigational New Drug Application',
    scope: 'system-default',
    version: 'v3.2',
    lastModified: 'Feb 20, 2026',
    status: 'active',
  },
  {
    id: 'ind-s2',
    name: 'Investigator Brochure Template',
    description: 'eCTD Module 5 - Investigator Brochure standard structure',
    scope: 'system-default',
    version: 'v2.8',
    lastModified: 'Feb 18, 2026',
    status: 'active',
  },
  {
    id: 'ind-s3',
    name: 'Clinical Protocol Template',
    description: 'Standard clinical protocol template with ICH E6 compliance',
    scope: 'system-default',
    version: 'v4.1',
    lastModified: 'Feb 15, 2026',
    status: 'active',
  },
  {
    id: 'ind-s4',
    name: 'Module 1 Administrative Cover Letter',
    description: 'Cover letter for eCTD Module 1 regional submissions',
    scope: 'system-default',
    version: 'v2.0',
    lastModified: 'Feb 12, 2026',
    status: 'active',
  },
  {
    id: 'ind-s5',
    name: 'Safety Report Template (CIOMS I)',
    description: 'CIOMS Form I for Individual Case Safety Report',
    scope: 'system-default',
    version: 'v1.5',
    lastModified: 'Feb 10, 2026',
    status: 'suspended',
  },
];

const indTenantProjectTemplates: INDTemplate[] = [
  {
    id: 'ind-tp1',
    name: 'Lpathomab IND Cover Letter',
    description: 'Custom cover letter for Lpathomab IND submission',
    scope: 'tenant-project',
    tenant: 'filynai.com',
    project: 'Lpathomab',
    version: 'v1.3',
    lastModified: 'Feb 21, 2026',
    status: 'active',
  },
  {
    id: 'ind-tp2',
    name: 'NeuroFix Protocol Amendment',
    description: 'Protocol amendment template for NeuroFix Phase II',
    scope: 'tenant-project',
    tenant: 'Acme Corporation',
    project: 'NeuroFix',
    version: 'v2.1',
    lastModified: 'Feb 19, 2026',
    status: 'active',
  },
  {
    id: 'ind-tp3',
    name: 'OncoVax Safety Narrative',
    description: 'Customized safety narrative for OncoVax trial',
    scope: 'tenant-project',
    tenant: 'Test Company',
    project: 'OncoVax',
    version: 'v1.0',
    lastModified: 'Feb 16, 2026',
    status: 'suspended',
  },
  {
    id: 'ind-tp4',
    name: 'CardioZen Clinical Study Report',
    description: 'CSR template tailored for CardioZen cardiovascular study',
    scope: 'tenant-project',
    tenant: 'Acme Corporation',
    project: 'CardioZen',
    version: 'v1.7',
    lastModified: 'Feb 13, 2026',
    status: 'active',
  },
];

const wordTemplates: WordTemplate[] = [
  {
    id: 'wt-1',
    name: 'FDA Response Letter',
    description: 'Standard template for responding to FDA information requests',
    category: 'Regulatory',
    version: 'v2.4',
    lastModified: 'Feb 21, 2026',
    status: 'active',
  },
  {
    id: 'wt-2',
    name: 'Clinical Study Report (ICH E3)',
    description: 'Full ICH E3 compliant clinical study report template',
    category: 'Clinical',
    version: 'v5.0',
    lastModified: 'Feb 19, 2026',
    status: 'active',
  },
  {
    id: 'wt-3',
    name: 'Non-Clinical Overview',
    description: 'eCTD Module 2.4 Non-clinical overview document template',
    category: 'eCTD',
    version: 'v3.1',
    lastModified: 'Feb 17, 2026',
    status: 'active',
  },
  {
    id: 'wt-4',
    name: 'Risk Management Plan',
    description: 'EU-format risk management plan template',
    category: 'Safety',
    version: 'v1.8',
    lastModified: 'Feb 14, 2026',
    status: 'suspended',
  },
  {
    id: 'wt-5',
    name: 'Meeting Request Brief',
    description: 'Pre-IND or Type A/B/C meeting request briefing document',
    category: 'Regulatory',
    version: 'v2.2',
    lastModified: 'Feb 11, 2026',
    status: 'active',
  },
];

// --- Upload validation logic ---

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: {
    fileName: string;
    fileSize: string;
    detectedType: string;
    fieldCount?: number;
  };
}

function simulateValidation(file: File): Promise<ValidationResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const isValidExt = ext === 'xlsx' || ext === 'xls' || ext === 'json';
      const isSmallEnough = file.size < 10 * 1024 * 1024; // 10MB

      const errors: string[] = [];
      const warnings: string[] = [];

      if (!isValidExt) {
        errors.push(
          `Unsupported file format ".${ext}". Only .xlsx, .xls, and .json files are accepted.`,
        );
      }
      if (!isSmallEnough) {
        errors.push(
          `File size (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds the 10 MB limit.`,
        );
      }

      if (errors.length === 0) {
        // Simulate deeper validation
        if (file.size < 500) {
          warnings.push(
            'File appears to have very little content. Please verify it contains the full template structure.',
          );
        }
      }

      resolve({
        valid: errors.length === 0,
        errors,
        warnings,
        info: {
          fileName: file.name,
          fileSize:
            file.size > 1024 * 1024
              ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
              : `${(file.size / 1024).toFixed(1)} KB`,
          detectedType: ext === 'json' ? 'JSON Template' : 'Excel Template',
          fieldCount:
            errors.length === 0
              ? Math.floor(Math.random() * 20) + 8
              : undefined,
        },
      });
    }, 1500);
  });
}

// --- Components ---

function StatusToggleButton({
  status,
  onToggle,
}: {
  status: TemplateStatus;
  onToggle: () => void;
}) {
  const isActive = status === 'active';
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
        isActive
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
          : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
      }`}
      title={isActive ? 'Suspend this template' : 'Activate this template'}
    >
      {isActive ? (
        <>
          <Power className='size-3' />
          Active
        </>
      ) : (
        <>
          <PowerOff className='size-3' />
          Suspended
        </>
      )}
    </button>
  );
}

function INDTemplateRow({
  template,
  onEdit,
  onUpload,
  onToggleStatus,
}: {
  template: INDTemplate;
  onEdit: () => void;
  onUpload: () => void;
  onToggleStatus: () => void;
}) {
  return (
    <div className='group flex items-center justify-between rounded-md border border-border bg-background p-3.5 transition-colors hover:border-primary/30 hover:bg-accent/40'>
      <div className='flex items-center gap-3 overflow-hidden'>
        <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
          <FileCode className='size-4 text-primary' />
        </div>
        <div className='min-w-0'>
          <div className='flex items-center gap-2'>
            <span className='truncate text-sm font-medium text-foreground'>
              {template.name}
            </span>
            <span className='shrink-0 text-[10px] text-muted-foreground'>
              {template.version}
            </span>
          </div>
          <p className='truncate text-xs text-muted-foreground'>
            {template.description}
          </p>
          {template.scope === 'tenant-project' && (
            <div className='mt-1 flex items-center gap-2'>
              <span className='flex items-center gap-1 text-[10px] text-muted-foreground'>
                <Building2 className='size-2.5' />
                {template.tenant}
              </span>
              <span className='flex items-center gap-1 text-[10px] text-muted-foreground'>
                <FolderKanban className='size-2.5' />
                {template.project}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <span className='hidden text-xs text-muted-foreground lg:inline'>
          {template.lastModified}
        </span>
        <StatusToggleButton
          status={template.status}
          onToggle={onToggleStatus}
        />
        <Button
          variant='outline'
          size='sm'
          className='h-7 gap-1 text-xs'
          onClick={onEdit}
        >
          <Pencil className='size-3' />
          Edit
          <ExternalLink className='size-2.5 text-muted-foreground' />
        </Button>
        <Button
          variant='outline'
          size='sm'
          className='h-7 gap-1 text-xs'
          onClick={onUpload}
        >
          <Upload className='size-3' />
          Upload
        </Button>
      </div>
    </div>
  );
}

function WordTemplateRow({
  template,
  onEdit,
  onUpload,
  onToggleStatus,
}: {
  template: WordTemplate;
  onEdit: () => void;
  onUpload: () => void;
  onToggleStatus: () => void;
}) {
  return (
    <div className='group flex items-center justify-between rounded-md border border-border bg-background p-3.5 transition-colors hover:border-primary/30 hover:bg-accent/40'>
      <div className='flex items-center gap-3 overflow-hidden'>
        <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
          <FileText className='size-4 text-primary' />
        </div>
        <div className='min-w-0'>
          <div className='flex items-center gap-2'>
            <span className='truncate text-sm font-medium text-foreground'>
              {template.name}
            </span>
            <Badge variant='secondary' className='text-[10px]'>
              {template.category}
            </Badge>
            <span className='shrink-0 text-[10px] text-muted-foreground'>
              {template.version}
            </span>
          </div>
          <p className='truncate text-xs text-muted-foreground'>
            {template.description}
          </p>
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <span className='hidden text-xs text-muted-foreground lg:inline'>
          {template.lastModified}
        </span>
        <StatusToggleButton
          status={template.status}
          onToggle={onToggleStatus}
        />
        <Button
          variant='outline'
          size='sm'
          className='h-7 gap-1 text-xs'
          onClick={onEdit}
        >
          <Pencil className='size-3' />
          Edit
          <ExternalLink className='size-2.5 text-muted-foreground' />
        </Button>
        <Button
          variant='outline'
          size='sm'
          className='h-7 gap-1 text-xs'
          onClick={onUpload}
        >
          <Upload className='size-3' />
          Upload
        </Button>
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  icon: Icon,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ElementType;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className='mb-2 flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent/50'
      >
        {open ? (
          <ChevronDown className='size-4 text-muted-foreground' />
        ) : (
          <ChevronRight className='size-4 text-muted-foreground' />
        )}
        <Icon className='size-4 text-primary' />
        {title}
        <Badge variant='secondary' className='ml-1 text-[10px]'>
          {count}
        </Badge>
      </button>
      {open && <div className='flex flex-col gap-2'>{children}</div>}
    </div>
  );
}

// --- Upload Dialog ---

function UploadDialog({
  open,
  onOpenChange,
  templateName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const resetState = useCallback(() => {
    setFile(null);
    setValidating(false);
    setValidationResult(null);
    setUploading(false);
    setUploadComplete(false);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setValidationResult(null);
    setUploadComplete(false);
    setValidating(true);

    const result = await simulateValidation(selected);
    setValidationResult(result);
    setValidating(false);
  };

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setUploadComplete(true);
    }, 2000);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Upload className='size-4' />
            Upload Template
          </DialogTitle>
          <DialogDescription>
            Upload a replacement file for{' '}
            <span className='font-medium text-foreground'>{templateName}</span>.
            Accepted formats: .xlsx, .xls, .json
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-4'>
          {/* Drop zone / File picker */}
          {!uploadComplete && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className='flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center transition-colors hover:border-primary/40 hover:bg-accent/30'
            >
              <div className='flex items-center gap-2 text-muted-foreground'>
                <FileSpreadsheet className='size-5' />
                <FileJson className='size-5' />
              </div>
              <div>
                <p className='text-sm font-medium text-foreground'>
                  {file ? file.name : 'Click to select a file'}
                </p>
                <p className='mt-0.5 text-xs text-muted-foreground'>
                  {file
                    ? 'Click to choose a different file'
                    : 'Supports .xlsx, .xls, and .json formats (max 10 MB)'}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type='file'
                accept='.xlsx,.xls,.json'
                className='hidden'
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* Validating state */}
          {validating && (
            <div className='flex items-center gap-2 rounded-md border border-border bg-muted/30 p-3'>
              <Loader2 className='size-4 animate-spin text-primary' />
              <span className='text-sm text-muted-foreground'>
                Validating file format...
              </span>
            </div>
          )}

          {/* Validation results */}
          {validationResult && !uploadComplete && (
            <div className='flex flex-col gap-3'>
              {/* File info */}
              <div className='rounded-md border border-border bg-card p-3'>
                <p className='mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  File Details
                </p>
                <div className='grid grid-cols-2 gap-y-1.5 text-xs'>
                  <span className='text-muted-foreground'>File Name</span>
                  <span className='truncate font-medium text-foreground'>
                    {validationResult.info.fileName}
                  </span>
                  <span className='text-muted-foreground'>File Size</span>
                  <span className='font-medium text-foreground'>
                    {validationResult.info.fileSize}
                  </span>
                  <span className='text-muted-foreground'>Detected Type</span>
                  <span className='font-medium text-foreground'>
                    {validationResult.info.detectedType}
                  </span>
                  {validationResult.info.fieldCount && (
                    <>
                      <span className='text-muted-foreground'>
                        Fields Detected
                      </span>
                      <span className='font-medium text-foreground'>
                        {validationResult.info.fieldCount} fields
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Validation status banner */}
              {validationResult.valid ? (
                <div className='flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3'>
                  <CheckCircle2 className='mt-0.5 size-4 shrink-0 text-emerald-600' />
                  <div>
                    <p className='text-sm font-medium text-emerald-800'>
                      Validation Passed
                    </p>
                    <p className='text-xs text-emerald-600'>
                      File format is valid and ready to be loaded into the
                      system.
                    </p>
                  </div>
                </div>
              ) : (
                <div className='flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3'>
                  <XCircle className='mt-0.5 size-4 shrink-0 text-red-600' />
                  <div>
                    <p className='text-sm font-medium text-red-800'>
                      Validation Failed
                    </p>
                    <ul className='mt-1 flex flex-col gap-0.5'>
                      {validationResult.errors.map((err, i) => (
                        <li key={i} className='text-xs text-red-600'>
                          {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {validationResult.warnings.length > 0 && (
                <div className='flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3'>
                  <AlertTriangle className='mt-0.5 size-4 shrink-0 text-amber-600' />
                  <div>
                    <p className='text-sm font-medium text-amber-800'>
                      Warnings
                    </p>
                    <ul className='mt-1 flex flex-col gap-0.5'>
                      {validationResult.warnings.map((w, i) => (
                        <li key={i} className='text-xs text-amber-600'>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload complete */}
          {uploadComplete && (
            <div className='flex flex-col items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-8 text-center'>
              <CheckCircle2 className='size-10 text-emerald-600' />
              <div>
                <p className='text-sm font-semibold text-emerald-800'>
                  Template Loaded Successfully
                </p>
                <p className='mt-1 text-xs text-emerald-600'>
                  The template has been uploaded and applied to the system.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {uploadComplete ? (
            <Button onClick={() => handleClose(false)}>Done</Button>
          ) : (
            <>
              <Button variant='outline' onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                disabled={!validationResult?.valid || uploading}
                onClick={handleUpload}
                className='bg-primary text-primary-foreground hover:bg-primary/90'
              >
                {uploading ? (
                  <>
                    <Loader2 className='mr-1.5 size-3.5 animate-spin' />
                    Loading...
                  </>
                ) : (
                  'OK - Load to System'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Panel ---

export function TemplateEditorPanel() {
  const [searchQuery, setSearchQuery] = useState('');

  const [indSysTemplates, setIndSysTemplates] = useState(indSystemDefaults);
  const [indTPTemplates, setIndTPTemplates] = useState(
    indTenantProjectTemplates,
  );
  const [wTemplates, setWTemplates] = useState(wordTemplates);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTargetName, setUploadTargetName] = useState('');

  const handleEdit = () => {
    // Opens template editor in new tab (under development)
    window.open('/template-editor', '_blank');
  };

  const handleUpload = (name: string) => {
    setUploadTargetName(name);
    setUploadOpen(true);
  };

  const toggleIndSysStatus = (id: string) => {
    setIndSysTemplates((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === 'active' ? 'suspended' : 'active' }
          : t,
      ),
    );
  };

  const toggleIndTPStatus = (id: string) => {
    setIndTPTemplates((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === 'active' ? 'suspended' : 'active' }
          : t,
      ),
    );
  };

  const toggleWordStatus = (id: string) => {
    setWTemplates((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === 'active' ? 'suspended' : 'active' }
          : t,
      ),
    );
  };

  const filterMatch = (name: string) =>
    !searchQuery || name.toLowerCase().includes(searchQuery.toLowerCase());

  const filteredIndSys = indSysTemplates.filter((t) => filterMatch(t.name));
  const filteredIndTP = indTPTemplates.filter((t) => filterMatch(t.name));
  const filteredWord = wTemplates.filter((t) => filterMatch(t.name));

  return (
    <div className='flex flex-col gap-5'>
      {/* Search */}
      <div className='flex items-center gap-3'>
        <div className='relative max-w-sm flex-1'>
          <Search className='absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search templates...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='bg-card pl-8'
          />
        </div>
      </div>

      {/* Main Tabs: IND Templates vs Word Templates */}
      <Tabs defaultValue='ind'>
        <TabsList>
          <TabsTrigger value='ind'>
            <FileCode className='mr-1.5 size-3.5' />
            IND Templates
            <Badge variant='secondary' className='ml-1.5 text-[10px]'>
              {indSysTemplates.length + indTPTemplates.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value='word'>
            <FileText className='mr-1.5 size-3.5' />
            Word Templates
            <Badge variant='secondary' className='ml-1.5 text-[10px]'>
              {wTemplates.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* IND Templates Tab */}
        <TabsContent value='ind' className='flex flex-col gap-6'>
          {/* System Defaults */}
          <CollapsibleSection
            title='System Default Templates'
            icon={FileCode}
            count={filteredIndSys.length}
            defaultOpen={true}
          >
            {filteredIndSys.length === 0 ? (
              <p className='py-4 text-center text-sm text-muted-foreground'>
                No matching system default templates found.
              </p>
            ) : (
              filteredIndSys.map((t) => (
                <INDTemplateRow
                  key={t.id}
                  template={t}
                  onEdit={handleEdit}
                  onUpload={() => handleUpload(t.name)}
                  onToggleStatus={() => toggleIndSysStatus(t.id)}
                />
              ))
            )}
          </CollapsibleSection>

          {/* Tenant-Project Specific */}
          <CollapsibleSection
            title='Tenant-Project Specific Templates'
            icon={Building2}
            count={filteredIndTP.length}
            defaultOpen={true}
          >
            {filteredIndTP.length === 0 ? (
              <p className='py-4 text-center text-sm text-muted-foreground'>
                No matching tenant-project templates found.
              </p>
            ) : (
              filteredIndTP.map((t) => (
                <INDTemplateRow
                  key={t.id}
                  template={t}
                  onEdit={handleEdit}
                  onUpload={() => handleUpload(t.name)}
                  onToggleStatus={() => toggleIndTPStatus(t.id)}
                />
              ))
            )}
          </CollapsibleSection>
        </TabsContent>

        {/* Word Templates Tab */}
        <TabsContent value='word'>
          {filteredWord.length === 0 ? (
            <p className='py-4 text-center text-sm text-muted-foreground'>
              No matching word templates found.
            </p>
          ) : (
            <div className='flex flex-col gap-2'>
              {filteredWord.map((t) => (
                <WordTemplateRow
                  key={t.id}
                  template={t}
                  onEdit={handleEdit}
                  onUpload={() => handleUpload(t.name)}
                  onToggleStatus={() => toggleWordStatus(t.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        templateName={uploadTargetName}
      />
    </div>
  );
}
