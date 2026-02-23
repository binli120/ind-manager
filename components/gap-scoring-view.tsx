// Author: Bin Lee
// Email: binlee120@gmail.com
'use client';

import type React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  Brain,
  Calendar,
  CheckCircle,
  Eye,
  FileText,
  MessageSquare,
  Upload,
  User,
} from 'lucide-react';
import { useCallback, useState } from 'react';

export function GapScoringView() {
  const [selectedDocumentType, setSelectedDocumentType] =
    useState('FDA Form 1571');
  const [selectedAIModel, setSelectedAIModel] = useState('Filynai-llm3');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const documentTypes = [
    'FDA Form 1571',
    'FDA Form 1572',
    "Investigator's Brochure",
    'Clinical Protocol',
    'Chemistry Manufacturing Controls',
    'Pharmacology Toxicology',
  ];

  const aiModels = [
    { value: 'Filynai-llm3', description: "Filynai's hosted LLM" },
    { value: 'ChatGPT (GPT-4)', description: "OpenAI's most advanced model" },
    {
      value: 'Claude 3.5 Sonnet',
      description: "Anthropic's latest reasoning model",
    },
    { value: 'Gemini Pro', description: "Google's multimodal AI model" },
  ];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setUploadedFile(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFile(files[0]);
    }
  }, []);

  const gapAlerts = [
    {
      id: 1,
      module: 'Module 1 - 1.3',
      severity: 'critical',
      status: 'open',
      title: 'Form 1571 missing e-signature',
      description:
        'FDA Form 1571 requires electronic signature from authorized representative',
      assignee: 'J. Martinez',
      dueDate: '2024-01-25',
    },
    {
      id: 2,
      module: 'Module 4 - 4.2',
      severity: 'critical',
      status: 'in-progress',
      title: 'GLP compliance certificate missing',
      description: 'Toxicology studies require GLP compliance documentation',
      assignee: 'Dr. Taylor',
      dueDate: '2024-01-28',
    },
    {
      id: 3,
      module: 'Module 2 - 2.3',
      severity: 'warning',
      status: 'open',
      title: 'QOS section 3.2.P.5 incomplete',
      description:
        'Quality Overall Summary missing manufacturing process details',
      assignee: 'Dr. Chen',
      dueDate: '2024-01-30',
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'in-progress':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className='flex-1 overflow-y-auto bg-background'>
      {/* Header */}
      <div className='bg-background border-b border-border px-8 py-6'>
        <div className='max-w-4xl'>
          <div className='flex items-center gap-3 mb-3'>
            <div className='w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center'>
              <BarChart3 className='w-5 h-5 text-accent' />
            </div>
            <h1 className='text-2xl font-bold text-foreground'>
              IND Submission Structure and Content Gap Scoring
            </h1>
          </div>
          <p className='text-muted leading-relaxed'>
            Multi-dimensional assessment framework for evaluating eCTD
            compliance across completeness, correctness, structure, linkage, and
            technical validation readiness. Provides a Submission Readiness
            Index (SRI) to assess overall submission readiness.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className='px-8 py-6'>
        <div className='max-w-4xl space-y-6'>
          {/* Document Analysis Input Card */}
          <Card className='shadow-sm'>
            <CardHeader className='pb-4'>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center'>
                  <FileText className='w-4 h-4 text-primary' />
                </div>
                <div>
                  <CardTitle className='text-lg'>
                    Document Analysis Input
                  </CardTitle>
                  <p className='text-sm text-muted mt-1'>
                    Upload a PDF or TXT document to analyze using the
                    multi-dimensional eCTD compliance framework
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Configuration Row */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Document Type */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-foreground'>
                    Document Type
                  </label>
                  <Select
                    value={selectedDocumentType}
                    onValueChange={setSelectedDocumentType}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* AI Model */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-foreground'>
                    AI Model
                  </label>
                  <Select
                    value={selectedAIModel}
                    onValueChange={setSelectedAIModel}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aiModels.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          <div className='flex items-center gap-2'>
                            <Brain className='w-4 h-4 text-accent' />
                            <div>
                              <div className='font-medium'>{model.value}</div>
                              <div className='text-xs text-muted'>
                                {model.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Upload Document */}
              <div className='space-y-2'>
                <label className='text-sm font-medium text-foreground'>
                  Upload Document
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragOver
                      ? 'border-accent bg-accent/5'
                      : uploadedFile
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                      : 'border-border hover:border-accent/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type='file'
                    accept='.pdf,.txt'
                    onChange={handleFileSelect}
                    className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                  />

                  {uploadedFile ? (
                    <div className='space-y-3'>
                      <div className='w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto'>
                        <CheckCircle className='w-6 h-6 text-green-600' />
                      </div>
                      <div>
                        <p className='font-medium text-green-700 dark:text-green-400'>
                          {uploadedFile.name}
                        </p>
                        <p className='text-sm text-green-600 dark:text-green-500'>
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Badge
                        variant='secondary'
                        className='bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      >
                        Ready for analysis
                      </Badge>
                    </div>
                  ) : (
                    <div className='space-y-3'>
                      <div className='w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto'>
                        <Upload className='w-6 h-6 text-muted-foreground' />
                      </div>
                      <div>
                        <p className='font-medium text-foreground'>
                          Drag and drop your file here, or browse
                        </p>
                        <p className='text-sm text-muted'>
                          Supports PDF and TXT files (max 10MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Run Analysis Button */}
              <Button
                className='w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-medium'
                disabled={!uploadedFile}
              >
                <BarChart3 className='w-4 h-4 mr-2' />
                Run Gap Scoring Analysis
              </Button>
            </CardContent>
          </Card>

          {/* Analysis Framework Info */}
          <Card className='shadow-sm'>
            <CardHeader>
              <CardTitle className='text-lg'>Analysis Framework</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <h4 className='font-medium text-foreground'>Completeness</h4>
                  <p className='text-sm text-muted'>
                    Evaluates missing sections and required content
                  </p>
                </div>
                <div className='space-y-2'>
                  <h4 className='font-medium text-foreground'>Correctness</h4>
                  <p className='text-sm text-muted'>
                    Assesses accuracy and regulatory compliance
                  </p>
                </div>
                <div className='space-y-2'>
                  <h4 className='font-medium text-foreground'>Structure</h4>
                  <p className='text-sm text-muted'>
                    Analyzes document organization and formatting
                  </p>
                </div>
                <div className='space-y-2'>
                  <h4 className='font-medium text-foreground'>Linkage</h4>
                  <p className='text-sm text-muted'>
                    Checks cross-references and dependencies
                  </p>
                </div>
                <div className='space-y-2'>
                  <h4 className='font-medium text-foreground'>
                    Technical Validation
                  </h4>
                  <p className='text-sm text-muted'>
                    Validates technical specifications and data
                  </p>
                </div>
                <div className='space-y-2'>
                  <h4 className='font-medium text-foreground'>
                    Readiness Index
                  </h4>
                  <p className='text-sm text-muted'>
                    Overall submission readiness score (SRI)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI-Powered Gap Alerts section */}
          <Card className='shadow-sm'>
            <CardHeader className='pb-4'>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center'>
                  <Brain className='w-4 h-4 text-accent' />
                </div>
                <div>
                  <CardTitle className='text-lg'>
                    AI-Powered Gap Alerts
                  </CardTitle>
                  <p className='text-sm text-muted mt-1'>
                    Automated compliance and completeness issues
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              {gapAlerts.map((alert) => (
                <Card
                  key={alert.id}
                  className='border border-border/50 shadow-sm'
                >
                  <CardContent className='p-4'>
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex-1 space-y-3'>
                        {/* Header with module and badges */}
                        <div className='flex items-center gap-2 flex-wrap'>
                          <span className='text-sm font-medium text-muted-foreground'>
                            {alert.module}
                          </span>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <Badge className={getStatusColor(alert.status)}>
                            {alert.status}
                          </Badge>
                        </div>

                        {/* Title and description */}
                        <div className='space-y-1'>
                          <h4 className='font-medium text-foreground'>
                            {alert.title}
                          </h4>
                          <p className='text-sm text-muted'>
                            {alert.description}
                          </p>
                        </div>

                        {/* Assignee and due date */}
                        <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                          <div className='flex items-center gap-1'>
                            <User className='w-3 h-3' />
                            <span>{alert.assignee}</span>
                          </div>
                          <div className='flex items-center gap-1'>
                            <Calendar className='w-3 h-3' />
                            <span>Due: {alert.dueDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='text-muted-foreground hover:text-foreground'
                        >
                          <Eye className='w-4 h-4 mr-1' />
                          View
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='text-muted-foreground hover:text-foreground'
                        >
                          <MessageSquare className='w-4 h-4 mr-1' />
                          Comment
                        </Button>
                        <Button
                          size='sm'
                          className='bg-foreground text-background hover:bg-foreground/90'
                        >
                          Assign Fix
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
