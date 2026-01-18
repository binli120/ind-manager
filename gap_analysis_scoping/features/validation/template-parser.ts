/**
 * Template Parser for Gap Analysis Completeness Check
 * 
 * Parses Excel and JSON templates to extract validation rules for document completeness checking.
 * Supports multiple template formats and provides structured validation rule extraction.
 */

import * as XLSX from 'xlsx';

export interface ValidationRule {
  name: string;
  description: string;
  type: 'content_presence' | 'format_requirement';
  field: string;
  required: boolean;
  severity: 'critical' | 'warning' | 'info';
  remediationHint: string;
}

export interface ValidationRuleSet {
  name: string;
  templateType: 'excel' | 'json';
  rules: ValidationRule[];
}

/**
 * TemplateParser class for parsing Excel and JSON templates
 * Extracts validation rules from template structures
 */
export class TemplateParser {
  /**
   * Parse JSON template and extract validation rules
   * @param fileContent - JSON string content
   * @returns ValidationRuleSet with extracted rules
   */
  parseJsonTemplate(fileContent: string): ValidationRuleSet {
    try {
      const template = JSON.parse(fileContent);
      
      // Extract validation rules from JSON structure
      const rules = this.extractValidationRules(template);
      
      return {
        name: template.section || template.summary_id || 'Unknown Template',
        templateType: 'json',
        rules
      };
    } catch (error) {
      throw new Error(`Failed to parse JSON template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse Excel template and extract validation rules
   * Reads Excel file and extracts validation rules from the template structure
   * 
   * @param fileContent - Buffer containing Excel file data
   * @returns ValidationRuleSet with extracted rules
   */
  parseExcelTemplate(fileContent: Buffer): ValidationRuleSet {
    try {
      // Read Excel workbook from buffer
      const workbook = XLSX.read(fileContent, { type: 'buffer' });
      
      // Get the first sheet (assuming template data is in first sheet)
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert sheet to JSON
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      // Extract template structure from Excel data
      const template = this.extractTemplateFromExcelData(data);
      
      // Extract validation rules from template
      const rules = this.extractValidationRules(template);
      
      return {
        name: template.section || firstSheetName || 'Excel Template',
        templateType: 'excel',
        rules
      };
    } catch (error) {
      throw new Error(`Failed to parse Excel template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract template structure from Excel data
   * Converts Excel rows/columns into a template object
   * 
   * @param data - 2D array of Excel cell values
   * @returns Template object
   */
  private extractTemplateFromExcelData(data: any[][]): any {
    const template: any = {};
    
    // Skip empty rows
    const nonEmptyRows = data.filter(row => row && row.length > 0 && row.some(cell => cell !== undefined && cell !== null && cell !== ''));
    
    if (nonEmptyRows.length === 0) {
      throw new Error('Excel template is empty');
    }
    
    // The Excel template has a structured format with headers in first row
    // Try to parse as structured template with headers
    if (nonEmptyRows.length > 1) {
      const headers = nonEmptyRows[0];
      
      // Check if this looks like a structured template (has "Section" column)
      const sectionColIndex = headers.findIndex((h: any) => 
        h && String(h).toLowerCase().includes('section') && !String(h).toLowerCase().includes('subsection')
      );
      
      if (sectionColIndex >= 0) {
        // This is a structured template - extract metadata
        template.template_type = 'structured';
        template.section = headers[sectionColIndex];
        template.headers = headers; // Store all headers for reference
        
        // Extract section information from data rows with ALL columns
        const sections: any[] = [];
        for (let i = 1; i < nonEmptyRows.length; i++) {
          const row = nonEmptyRows[i];
          if (row[sectionColIndex]) {
            const sectionData: any = {};
            
            // Map each column to its header
            headers.forEach((header: any, colIndex: number) => {
              if (header && row[colIndex] !== undefined && row[colIndex] !== null && row[colIndex] !== '') {
                const headerKey = String(header).trim();
                sectionData[headerKey] = row[colIndex];
              }
            });
            
            // Also add convenience properties for common columns
            sectionData.section = row[sectionColIndex];
            sectionData.section_header = row[sectionColIndex + 1] || '';
            sectionData.subsection = row[sectionColIndex + 2] || '';
            sectionData.subsection_header = row[sectionColIndex + 3] || '';
            sectionData.element = row[sectionColIndex + 4] || '';
            sectionData.content = row[sectionColIndex + 5] || '';
            
            sections.push(sectionData);
          }
        }
        
        template.sections = sections;
        template.section_count = sections.length;
        
        // Set a representative section identifier
        if (sections.length > 0 && sections[0].section) {
          template.section = String(sections[0].section);
        }
        
        return template;
      }
    }
    
    // Fallback: Try to detect key-value pairs
    for (const row of nonEmptyRows) {
      if (row.length >= 2) {
        const key = String(row[0]).trim().toLowerCase().replace(/\s+/g, '_');
        const value = row[1];
        
        // Map common field names
        if (key && value !== undefined && value !== null && value !== '') {
          if (key.includes('section') || key.includes('module')) {
            template.section = String(value).trim();
          } else if (key.includes('summary') && key.includes('text')) {
            template.summary_text = String(value).trim();
          } else if (key.includes('status')) {
            template.status = String(value).trim();
          } else if (key.includes('summary') && key.includes('id')) {
            template.summary_id = String(value).trim();
          } else if (key.includes('element') && key.includes('number')) {
            // Parse element numbers as array
            if (Array.isArray(value)) {
              template.element_numbers = value;
            } else if (typeof value === 'string') {
              template.element_numbers = value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
            } else {
              template.element_numbers = [value];
            }
          } else if (key.includes('previous') && key.includes('summary')) {
            template.previous_summary_id = String(value).trim();
          } else {
            // Store other fields as-is
            template[key] = value;
          }
        }
      }
    }
    
    return template;
  }

  /**
   * Extract validation rules from template structure
   * Analyzes the template content and generates validation rules
   * 
   * MULTI-DIMENSIONAL VALIDATION:
   * - DIMENSION 1 (ROWS): Each row = required content element in the document
   * - DIMENSION 2 (COLUMNS): Each column = additional requirements about that content
   * 
   * @param template - Parsed template object
   * @returns Array of ValidationRule objects
   */
  extractValidationRules(template: any): ValidationRule[] {
    const rules: ValidationRule[] = [];

    // Handle structured templates (from Excel with sections)
    if (template.template_type === 'structured' && template.sections) {
      
      template.sections.forEach((section: any, index: number) => {
        const elementId = section.element || section['Subsection Element Numbering'] || section.subsection || section.section;
        const sectionHeader = section.subsection_header || section['Subsection Header'] || section.section_header || 'Section';
        const content = section.content || section['Content'] || '';
        
        // Determine if required
        const isRequired = content.toLowerCase().includes('required') || 
                          content.toLowerCase().includes('must') ||
                          !content.toLowerCase().includes('condition:');
        
        // Determine severity
        let severity: 'critical' | 'warning' | 'info' = 'warning';
        if (content.toLowerCase().includes('critical') || content.toLowerCase().includes('must')) {
          severity = 'critical';
        } else if (content.toLowerCase().includes('condition:') || content.toLowerCase().includes('if ')) {
          severity = 'info';
        }
        
        // ===== DIMENSION 1: ROW-BASED RULE (Content Presence) =====
        // Each row represents a section that must exist in the document
        rules.push({
          name: `${elementId}: ${sectionHeader} - Content Presence`,
          description: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
          type: 'content_presence',
          field: elementId,
          required: isRequired,
          severity: severity,
          remediationHint: `Add section ${elementId} (${sectionHeader}). ${content.substring(0, 100)}...`
        });

        // ===== DIMENSION 2: COLUMN-BASED RULES (Content Requirements) =====
        
        // Column Rule 1: Data Inputs
        const dataInputs = section['Data Inputs'];
        if (dataInputs && String(dataInputs).trim() !== '') {
          rules.push({
            name: `${elementId}: Required Data Inputs`,
            description: `Section must include specified data inputs: ${String(dataInputs).substring(0, 150)}...`,
            type: 'format_requirement',
            field: `${elementId}_data_inputs`,
            required: isRequired,
            severity: 'warning',
            remediationHint: `Include all required data inputs in section ${elementId}. Check template for: ${String(dataInputs).substring(0, 100)}...`
          });
        }

        // Column Rule 2: Module 4 Source Traceability
        const module4Source = section['Module 4 source (exact report + section/table)'];
        if (module4Source && String(module4Source).trim() !== '') {
          rules.push({
            name: `${elementId}: Source Traceability`,
            description: `Content must reference Module 4 sources: ${String(module4Source).substring(0, 150)}...`,
            type: 'format_requirement',
            field: `${elementId}_sources`,
            required: false,
            severity: 'info',
            remediationHint: `Add references to Module 4 source documents: ${String(module4Source).substring(0, 100)}...`
          });
        }

        // Column Rule 3: Critical Claim Elements
        const criticalClaims = section['Critical claim elements to trace'];
        if (criticalClaims && String(criticalClaims).trim() !== '') {
          rules.push({
            name: `${elementId}: Critical Claim Elements`,
            description: `Section must include traceable critical claims: ${String(criticalClaims).substring(0, 150)}...`,
            type: 'format_requirement',
            field: `${elementId}_claims`,
            required: isRequired,
            severity: 'critical',
            remediationHint: `Ensure all critical claim elements are present and traceable: ${String(criticalClaims).substring(0, 100)}...`
          });
        }

        // Column Rule 4: Modality-Specific Requirements (SM, BIO, ADC, ONT, Other)
        const modalityColumns = [
          { contentKey: 'SM (Small Molecule)', requiredKey: 'FIH IND Required – SM', modality: 'SM' },
          { contentKey: 'BIO (Biologics)', requiredKey: 'FIH IND Required – BIO', modality: 'BIO' },
          { contentKey: 'ADC (Antibody-Drug Conjugate)', requiredKey: 'FIH IND Required – ADC', modality: 'ADC' },
          { contentKey: 'ONT (Oligonucleotide-Based Therapeutics)', requiredKey: 'FIH IND Required – ONT', modality: 'ONT' },
          { contentKey: 'Other Modality', requiredKey: 'FIH IND Required – Other', modality: 'Other' }
        ];

        modalityColumns.forEach(({ contentKey, requiredKey, modality }) => {
          const modalityContent = section[contentKey];
          const modalityRequired = section[requiredKey];
          
          if (modalityContent && String(modalityContent).trim() !== '') {
            const isModalityRequired = String(modalityRequired).toLowerCase() === 'yes';
            
            rules.push({
              name: `${elementId}: ${modality} Modality Requirements`,
              description: `For ${modality} products: ${String(modalityContent).substring(0, 150)}...`,
              type: 'format_requirement',
              field: `${elementId}_${modality.toLowerCase()}`,
              required: isModalityRequired,
              severity: isModalityRequired ? 'warning' : 'info',
              remediationHint: `For ${modality} modality, ensure section ${elementId} follows guidance: ${String(modalityContent).substring(0, 100)}...`
            });
          }
        });

        // Column Rule 5: Tables/Figures Hints
        const tablesHint = section['Tables/Figures Hint'];
        if (tablesHint && String(tablesHint).trim() !== '' && String(tablesHint).toLowerCase().includes('hint:')) {
          rules.push({
            name: `${elementId}: Tables/Figures`,
            description: `Consider adding tables/figures: ${String(tablesHint).substring(0, 150)}...`,
            type: 'format_requirement',
            field: `${elementId}_tables_figures`,
            required: false,
            severity: 'info',
            remediationHint: String(tablesHint).substring(0, 200) + '...'
          });
        }
      });

      // Overall structural rule
      rules.push({
        name: 'Template Structure Completeness',
        description: `Document must contain all ${template.section_count} required sections with complete content, data inputs, and source references`,
        type: 'format_requirement',
        field: 'sections',
        required: true,
        severity: 'critical',
        remediationHint: `Ensure document includes all ${template.section_count} sections from the template with all required elements`
      });

      return rules;
    }

    // Handle simple templates (JSON-style)
    // Rule 1: Summary text presence (critical)
    if (template.summary_text !== undefined) {
      rules.push({
        name: 'Summary Text Presence',
        description: 'Document must contain a summary text section',
        type: 'content_presence',
        field: 'summary_text',
        required: true,
        severity: 'critical',
        remediationHint: 'Add a comprehensive summary text section to the document'
      });

      // Rule 2: Summary text minimum length (warning)
      rules.push({
        name: 'Summary Text Minimum Length',
        description: 'Summary text should be sufficiently detailed (minimum 100 characters)',
        type: 'format_requirement',
        field: 'summary_text',
        required: false,
        severity: 'warning',
        remediationHint: 'Expand the summary text to provide more detail (current minimum: 100 characters)'
      });

      // Rule 3: Summary text structure validation (warning)
      rules.push({
        name: 'Summary Text Structure',
        description: 'Summary text should contain structured sections with proper headings',
        type: 'format_requirement',
        field: 'summary_text',
        required: false,
        severity: 'warning',
        remediationHint: 'Organize summary text with clear section headings (e.g., 2.6.2.1, 2.6.2.2)'
      });
    }

    // Rule 4: Section identifier presence (critical)
    if (template.section !== undefined) {
      rules.push({
        name: 'Section Identifier Presence',
        description: 'Document must have a valid section identifier',
        type: 'content_presence',
        field: 'section',
        required: true,
        severity: 'critical',
        remediationHint: 'Add a section identifier (e.g., "2.6.2") to the document'
      });

      // Rule 5: Section identifier format (critical)
      rules.push({
        name: 'Section Identifier Format',
        description: 'Section identifier must follow the format X.Y.Z (e.g., 2.6.2)',
        type: 'format_requirement',
        field: 'section',
        required: true,
        severity: 'critical',
        remediationHint: 'Ensure section identifier follows the format X.Y.Z (e.g., "2.6.2")'
      });
    }

    // Rule 6: Status field presence (warning)
    if (template.status !== undefined) {
      rules.push({
        name: 'Document Status Presence',
        description: 'Document should have a status indicator',
        type: 'content_presence',
        field: 'status',
        required: false,
        severity: 'warning',
        remediationHint: 'Add a status field (e.g., "draft", "final", "review")'
      });

      // Rule 7: Status field valid values (warning)
      rules.push({
        name: 'Document Status Valid Values',
        description: 'Document status should be one of: draft, review, final, submitted',
        type: 'format_requirement',
        field: 'status',
        required: false,
        severity: 'warning',
        remediationHint: 'Set status to one of the valid values: "draft", "review", "final", or "submitted"'
      });
    }

    // Rule 8: Summary ID presence (info)
    if (template.summary_id !== undefined) {
      rules.push({
        name: 'Summary ID Presence',
        description: 'Document should have a unique summary identifier',
        type: 'content_presence',
        field: 'summary_id',
        required: false,
        severity: 'info',
        remediationHint: 'Add a unique summary ID (UUID format) for tracking purposes'
      });

      // Rule 9: Summary ID format validation (info)
      rules.push({
        name: 'Summary ID Format',
        description: 'Summary ID should be a valid UUID',
        type: 'format_requirement',
        field: 'summary_id',
        required: false,
        severity: 'info',
        remediationHint: 'Ensure summary ID is a valid UUID (e.g., "b880386f-fda6-4e92-8c90-d2db18adf774")'
      });
    }

    // Rule 10: Element numbers array presence (info)
    if (template.element_numbers !== undefined) {
      rules.push({
        name: 'Element Numbers Presence',
        description: 'Document may include element number references',
        type: 'content_presence',
        field: 'element_numbers',
        required: false,
        severity: 'info',
        remediationHint: 'Consider adding element number references if applicable'
      });

      // Rule 11: Element numbers array format (info)
      rules.push({
        name: 'Element Numbers Format',
        description: 'Element numbers should be an array of integers',
        type: 'format_requirement',
        field: 'element_numbers',
        required: false,
        severity: 'info',
        remediationHint: 'Ensure element_numbers is an array of integer values'
      });
    }

    // Rule 12: Previous summary ID reference (info)
    if (template.previous_summary_id !== undefined) {
      rules.push({
        name: 'Previous Summary ID Reference',
        description: 'Document may reference a previous version via previous_summary_id',
        type: 'content_presence',
        field: 'previous_summary_id',
        required: false,
        severity: 'info',
        remediationHint: 'If this is a revision, add previous_summary_id to link to the previous version'
      });
    }

    return rules;
  }
}
