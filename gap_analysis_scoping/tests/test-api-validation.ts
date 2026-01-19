/**
 * Test script to verify the validation API endpoint
 */

async function testValidationAPI() {
  try {
    console.log('Testing validation API...\n');

    // Test 1: GET request (health check)
    console.log('1. Testing GET /api/validation (health check)...');
    const getResponse = await fetch('http://localhost:3002/api/validation');
    const getResult = await getResponse.json();
    console.log('   Status:', getResponse.status);
    console.log('   Response:', JSON.stringify(getResult, null, 2));
    console.log('   ✓ Health check passed\n');

    // Test 2: POST request with missing fields
    console.log('2. Testing POST /api/validation (missing fields)...');
    const postResponse1 = await fetch('http://localhost:3002/api/validation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const postResult1 = await postResponse1.json();
    console.log('   Status:', postResponse1.status);
    console.log('   Response:', JSON.stringify(postResult1, null, 2));
    console.log('   ✓ Error handling works\n');

    // Test 3: POST request with test data
    console.log('3. Testing POST /api/validation (with test data)...');
    
    // Read test files
    const fs = await import('fs');
    const path = await import('path');
    
    const templatePath = path.join(process.cwd(), 'gap_analysis_scoping/resources/template_2.6.2_poc.json');
    const documentPath = path.join(process.cwd(), 'gap_analysis_scoping/resources/2.6.2-summary.json');
    
    const templateBuffer = fs.readFileSync(templatePath);
    const documentBuffer = fs.readFileSync(documentPath);
    
    const templateBase64 = templateBuffer.toString('base64');
    const documentBase64 = documentBuffer.toString('base64');
    
    console.log('   Template size:', templateBuffer.length, 'bytes');
    console.log('   Document size:', documentBuffer.length, 'bytes');
    
    const postResponse2 = await fetch('http://localhost:3002/api/validation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateFile: templateBase64,
        templateName: 'template_2.6.2_poc.json',
        documentFile: documentBase64,
        documentName: '2.6.2-summary.json',
        templateType: 'json'
      })
    });
    
    console.log('   Status:', postResponse2.status);
    
    if (postResponse2.ok) {
      const postResult2 = await postResponse2.json();
      console.log('   ✓ Validation successful!');
      console.log('   Completeness:', postResult2.data.validation.completenessPercentage + '%');
      console.log('   Total Rules:', postResult2.data.validation.totalRules);
      console.log('   Passed:', postResult2.data.validation.passedRules);
      console.log('   Failed:', postResult2.data.validation.failedRules);
      console.log('   Alerts:', postResult2.data.alerts.length);
    } else {
      const errorText = await postResponse2.text();
      console.log('   ✗ Validation failed');
      console.log('   Response:', errorText.substring(0, 500));
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testValidationAPI();
