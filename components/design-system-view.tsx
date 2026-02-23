// Author: Bin Lee
// Email: binlee120@gmail.com
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, Info, Palette, Type, Layout, Zap } from "lucide-react"

export function DesignSystemView() {
  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-balance">FilynAI Design System</h1>
        <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
          A comprehensive design system for regulatory document management and compliance tracking
        </p>
      </div>

      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="components" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Components
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Patterns
          </TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>
                Our color system uses semantic tokens for consistent theming across light and dark modes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Primary Colors */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Primary Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="h-16 bg-primary rounded-lg border"></div>
                    <p className="text-sm font-medium">Primary</p>
                    <p className="text-xs text-muted-foreground">Main brand color</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 bg-primary-foreground rounded-lg border"></div>
                    <p className="text-sm font-medium">Primary Foreground</p>
                    <p className="text-xs text-muted-foreground">Text on primary</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 bg-secondary rounded-lg border"></div>
                    <p className="text-sm font-medium">Secondary</p>
                    <p className="text-xs text-muted-foreground">Secondary actions</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 bg-secondary-foreground rounded-lg border"></div>
                    <p className="text-sm font-medium">Secondary Foreground</p>
                    <p className="text-xs text-muted-foreground">Text on secondary</p>
                  </div>
                </div>
              </div>

              {/* Status Colors */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Status Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="h-16 bg-destructive rounded-lg border"></div>
                    <p className="text-sm font-medium">Destructive</p>
                    <p className="text-xs text-muted-foreground">Errors, critical issues</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 bg-green-500 rounded-lg border"></div>
                    <p className="text-sm font-medium">Success</p>
                    <p className="text-xs text-muted-foreground">Completed, approved</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 bg-yellow-500 rounded-lg border"></div>
                    <p className="text-sm font-medium">Warning</p>
                    <p className="text-xs text-muted-foreground">Attention needed</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 bg-blue-500 rounded-lg border"></div>
                    <p className="text-sm font-medium">Info</p>
                    <p className="text-xs text-muted-foreground">Information, pending</p>
                  </div>
                </div>
              </div>

              {/* Neutral Colors */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Neutral Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="h-16 bg-background rounded-lg border"></div>
                    <p className="text-sm font-medium">Background</p>
                    <p className="text-xs text-muted-foreground">Page background</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 bg-foreground rounded-lg border"></div>
                    <p className="text-sm font-medium">Foreground</p>
                    <p className="text-xs text-muted-foreground">Primary text</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 bg-muted rounded-lg border"></div>
                    <p className="text-sm font-medium">Muted</p>
                    <p className="text-xs text-muted-foreground">Subtle backgrounds</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 bg-border rounded-lg border"></div>
                    <p className="text-sm font-medium">Border</p>
                    <p className="text-xs text-muted-foreground">Component borders</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Typography Scale</CardTitle>
              <CardDescription>Consistent typography hierarchy for clear information architecture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h1 className="text-4xl font-bold">Heading 1</h1>
                  <p className="text-sm text-muted-foreground mt-1">text-4xl font-bold</p>
                </div>
                <div className="border-b pb-4">
                  <h2 className="text-3xl font-semibold">Heading 2</h2>
                  <p className="text-sm text-muted-foreground mt-1">text-3xl font-semibold</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="text-2xl font-semibold">Heading 3</h3>
                  <p className="text-sm text-muted-foreground mt-1">text-2xl font-semibold</p>
                </div>
                <div className="border-b pb-4">
                  <h4 className="text-xl font-medium">Heading 4</h4>
                  <p className="text-sm text-muted-foreground mt-1">text-xl font-medium</p>
                </div>
                <div className="border-b pb-4">
                  <p className="text-base">Body Text - Regular paragraph text with optimal readability</p>
                  <p className="text-sm text-muted-foreground mt-1">text-base</p>
                </div>
                <div className="border-b pb-4">
                  <p className="text-sm text-muted-foreground">Small Text - Secondary information and captions</p>
                  <p className="text-sm text-muted-foreground mt-1">text-sm text-muted-foreground</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Extra Small - Metadata and fine print</p>
                  <p className="text-sm text-muted-foreground mt-1">text-xs text-muted-foreground</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-6">
          {/* Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>Interactive elements for user actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm">Small</Button>
                  <Button>Default</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
              <CardDescription>Status indicators and labels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge className="bg-green-500 text-white">Success</Badge>
                <Badge className="bg-yellow-500 text-white">Warning</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Form Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Form Controls</CardTitle>
              <CardDescription>Input elements for data collection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Text Input</label>
                  <Input placeholder="Enter text..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose option..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Option 1</SelectItem>
                      <SelectItem value="option2">Option 2</SelectItem>
                      <SelectItem value="option3">Option 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Textarea</label>
                <Textarea placeholder="Enter longer text..." />
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="checkbox" />
                  <label htmlFor="checkbox" className="text-sm">
                    Checkbox
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="switch" />
                  <label htmlFor="switch" className="text-sm">
                    Switch
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Alerts</CardTitle>
              <CardDescription>Important messages and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>This is an informational alert with additional context.</AlertDescription>
              </Alert>
              <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>Operation completed successfully.</AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Something went wrong. Please try again.</AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Indicators</CardTitle>
              <CardDescription>Visual feedback for ongoing processes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Module 2 Progress</span>
                  <span>60%</span>
                </div>
                <Progress value={60} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Module 3 Progress</span>
                  <span>95%</span>
                </div>
                <Progress value={95} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Module 4 Progress</span>
                  <span>40%</span>
                </div>
                <Progress value={40} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-6">
          {/* Data Table Pattern */}
          <Card>
            <CardHeader>
              <CardTitle>Data Table Pattern</CardTitle>
              <CardDescription>Structured data presentation with actions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Document</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Owner</TableHead>
                    <TableHead className="text-center">Due Date</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-center">Protocol Summary</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-green-500 text-white">Complete</Badge>
                    </TableCell>
                    <TableCell className="text-center">Dr. Smith</TableCell>
                    <TableCell className="text-center">2024-01-15</TableCell>
                    <TableCell className="text-center">
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-center">Safety Report</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-yellow-500 text-white">In Progress</Badge>
                    </TableCell>
                    <TableCell className="text-center">Dr. Johnson</TableCell>
                    <TableCell className="text-center">2024-01-20</TableCell>
                    <TableCell className="text-center">
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Status Card Pattern */}
          <Card>
            <CardHeader>
              <CardTitle>Status Card Pattern</CardTitle>
              <CardDescription>Progress tracking and status visualization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Module 2</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="text-orange-600">60%</span>
                      </div>
                      <Progress value={60} />
                      <p className="text-xs text-muted-foreground">5 issues remaining</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Module 3</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="text-green-600">95%</span>
                      </div>
                      <Progress value={95} />
                      <p className="text-xs text-muted-foreground">1 issue remaining</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Module 4</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="text-red-600">40%</span>
                      </div>
                      <Progress value={40} />
                      <p className="text-xs text-muted-foreground">8 issues remaining</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Alert Card Pattern */}
          <Card>
            <CardHeader>
              <CardTitle>Alert Card Pattern</CardTitle>
              <CardDescription>Issue tracking and action items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">Critical</Badge>
                        <Badge variant="outline">Open</Badge>
                      </div>
                      <h4 className="font-medium">Form 1571 missing e-signature</h4>
                      <p className="text-sm text-muted-foreground">
                        FDA Form 1571 requires electronic signature from authorized representative
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>👤 J. Martinez</span>
                        <span>📅 Due: 2024-01-25</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        Comment
                      </Button>
                      <Button size="sm">Assign Fix</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
