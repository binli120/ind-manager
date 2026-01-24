/**
 * Test: Load Test Files API Endpoint
 * 
 * This test verifies that the API endpoint for loading test files works correctly.
 */

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002';

describe('Load Test Files API', () => {
  it('should load template test file successfully', async () => {
    const response = await fetch(`${BASE_URL}/api/gap-analysis/test-files?type=template`);
    
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    
    const data = await response.json();
    
    expect(data).toBeDefined();
    expect(data.name).toBe('2.6.2');
    expect(data.templateType).toBe('excel');
    expect(data.rules).toBeDefined();
    expect(Array.isArray(data.rules)).toBe(true);
    expect(data.rules.length).toBeGreaterThan(0);
  });

  it('should load document test file successfully', async () => {
    const response = await fetch(`${BASE_URL}/api/gap-analysis/test-files?type=document`);
    
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    
    const data = await response.json();
    
    expect(data).toBeDefined();
    expect(data.summary_id).toBeDefined();
    expect(data.section).toBe('2.6.2');
    expect(data.status).toBe('draft');
    expect(data.summary_text).toBeDefined();
    expect(typeof data.summary_text).toBe('string');
  });

  it('should return 400 for invalid file type', async () => {
    const response = await fetch(`${BASE_URL}/api/gap-analysis/test-files?type=invalid`);
    
    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error).toContain('Invalid file type');
  });

  it('should return 400 when type parameter is missing', async () => {
    const response = await fetch(`${BASE_URL}/api/gap-analysis/test-files`);
    
    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('should return JSON that can be converted to File objects', async () => {
    const [templateResponse, documentResponse] = await Promise.all([
      fetch(`${BASE_URL}/api/gap-analysis/test-files?type=template`),
      fetch(`${BASE_URL}/api/gap-analysis/test-files?type=document`)
    ]);

    expect(templateResponse.ok).toBe(true);
    expect(documentResponse.ok).toBe(true);

    const templateData = await templateResponse.json();
    const documentData = await documentResponse.json();

    // Verify we can convert to Blob (simulating browser File creation)
    const templateBlob = new Blob([JSON.stringify(templateData)], { type: 'application/json' });
    const documentBlob = new Blob([JSON.stringify(documentData)], { type: 'application/json' });

    expect(templateBlob.size).toBeGreaterThan(0);
    expect(documentBlob.size).toBeGreaterThan(0);
    expect(templateBlob.type).toBe('application/json');
    expect(documentBlob.type).toBe('application/json');
  });
});
