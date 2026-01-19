import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileType = searchParams.get('type'); // 'template' or 'document'

    if (!fileType || (fileType !== 'template' && fileType !== 'document')) {
      return NextResponse.json(
        { error: 'Invalid file type. Use ?type=template or ?type=document' },
        { status: 400 }
      );
    }

    // Determine which file to serve
    const fileName = fileType === 'template' 
      ? 'template_2.6.2_poc.json'
      : '2.6.2-summary.json';

    const filePath = path.join(
      process.cwd(),
      'gap_analysis_scoping',
      'resources',
      fileName
    );

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `File not found: ${fileName}` },
        { status: 404 }
      );
    }

    // Read and return the file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const jsonContent = JSON.parse(fileContent);

    return NextResponse.json(jsonContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error serving test file:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load test file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
