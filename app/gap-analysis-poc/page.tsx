'use client';

import { useState } from 'react';

export default function GapAnalysisPOC() {
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [templateType, setTemplateType] = useState<'excel' | 'json'>('json');
  const [isValidating, setIsValidating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTemplateFile(file);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentFile(file);
    }
  };

  const loadTestFiles = async () => {
    try {
      setIsValidating(true);
      setError(null);

      const [templateResponse, documentResponse] = await Promise.all([
        fetch('/gap_analysis_scoping/resources/template_2.6.2_poc.json'),
        fetch('/gap_analysis_scoping/resources/2.6.2-summary.json')
      ]);

      if (!templateResponse.ok || !documentResponse.ok) {
        throw new Error('Failed to load test files');
      }

      const templateBlob = await templateResponse.blob();
      const documentBlob = await documentResponse.blob();

      const template = new File([templateBlob], 'template_2.6.2_poc.json', { type: 'application/json' });
      const document = new File([documentBlob], '2.6.2-summary.json', { type: 'application/json' });

      setTemplateFile(template);
      setDocumentFile(document);
      setTemplateType('json');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load test files');
    } finally {
      setIsValidating(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleValidate = async () => {
    if (!templateFile || !documentFile) return;

    try {
      setIsValidating(true);
      setError(null);
      setResults(null);

      const templateBase64 = await fileToBase64(templateFile);
      const documentBase64 = await fileToBase64(documentFile);

      const response = await fetch('/api/gap-analysis/validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateFile: templateBase64,
          templateName: templateFile.name,
          documentFile: documentBase64,
          documentName: documentFile.name,
          templateType: templateType
        })
      });

      const result = await response.json();

      if (response.ok) {
        setResults(result.data);
      } else {
        setError(result.error + ': ' + result.details);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  const canValidate = templateFile && documentFile && !isValidating;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Gap Analysis Completeness Check</h1>
          <p className="text-sm opacity-90">Proof of Concept - Document Validation System</p>
        </div>

        <div className="p-8">
          {/* Template Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900">
              <span className="w-1 h-6 bg-purple-600 mr-3 rounded"></span>
              Template Selection
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Upload Template File
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,.json"
                onChange={handleTemplateChange}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-600 transition-colors cursor-pointer text-gray-900"
              />
              {templateFile && (
                <p className="mt-2 text-sm text-purple-700 font-medium">
                  Selected: {templateFile.name}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Template Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="templateType"
                    value="excel"
                    checked={templateType === 'excel'}
                    onChange={() => setTemplateType('excel')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-900">Excel (.xlsx, .xls)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="templateType"
                    value="json"
                    checked={templateType === 'json'}
                    onChange={() => setTemplateType('json')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-900">JSON (.json)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Document Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900">
              <span className="w-1 h-6 bg-purple-600 mr-3 rounded"></span>
              Document Selection
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Upload Document to Validate
              </label>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt,.json"
                onChange={handleDocumentChange}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-600 transition-colors cursor-pointer text-gray-900"
              />
              {documentFile && (
                <p className="mt-2 text-sm text-purple-700 font-medium">
                  Selected: {documentFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={loadTestFiles}
              disabled={isValidating}
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Load Test Files (For Testing)
            </button>

            <button
              onClick={handleValidate}
              disabled={!canValidate}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
            >
              {isValidating ? 'Validating...' : 'Validate Document'}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-900 font-semibold">✗ {error}</p>
            </div>
          )}

          {/* Results Display */}
          {results && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900">
                <span className="w-1 h-6 bg-purple-600 mr-3 rounded"></span>
                Validation Results
              </h2>

              <div className="bg-gray-50 rounded-lg p-6">
                {/* Score Display */}
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full text-4xl font-bold text-white mb-3 ${
                    results.validation.completenessPercentage >= 80 ? 'bg-gradient-to-br from-green-400 to-green-600' :
                    results.validation.completenessPercentage >= 50 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                    'bg-gradient-to-br from-red-400 to-red-600'
                  }`}>
                    {results.validation.completenessPercentage}%
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    Document Completeness Score
                  </div>
                  <div className="text-sm text-gray-700 mt-1">
                    Weighted Score: {results.validation.weightedScore}%
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg text-center border border-gray-200">
                    <div className="text-2xl font-bold text-purple-600">{results.validation.totalRules}</div>
                    <div className="text-xs text-gray-700 mt-1">Total Rules</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg text-center border border-gray-200">
                    <div className="text-2xl font-bold text-green-600">{results.validation.passedRules}</div>
                    <div className="text-xs text-gray-700 mt-1">Passed</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg text-center border border-gray-200">
                    <div className="text-2xl font-bold text-red-600">{results.validation.failedRules}</div>
                    <div className="text-xs text-gray-700 mt-1">Failed</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg text-center border border-gray-200">
                    <div className="text-2xl font-bold text-red-600">{results.validation.breakdown.critical.failed}</div>
                    <div className="text-xs text-gray-700 mt-1">Critical Issues</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg text-center border border-gray-200">
                    <div className="text-2xl font-bold text-yellow-600">{results.validation.breakdown.warning.failed}</div>
                    <div className="text-xs text-gray-700 mt-1">Warnings</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg text-center border border-gray-200">
                    <div className="text-2xl font-bold text-blue-600">{results.validation.breakdown.info.failed}</div>
                    <div className="text-xs text-gray-700 mt-1">Info</div>
                  </div>
                </div>

                {/* Alerts */}
                {results.alerts && results.alerts.length > 0 ? (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Validation Alerts ({results.alerts.length})
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {results.alerts.map((alert: any, index: number) => (
                        <div
                          key={index}
                          className={`bg-white p-4 rounded-lg border-l-4 ${
                            alert.severity === 'critical' ? 'border-red-500' :
                            alert.severity === 'warning' ? 'border-yellow-500' :
                            'border-blue-500'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                            <span className={`px-2 py-1 text-xs font-semibold rounded uppercase ${
                              alert.severity === 'critical' ? 'bg-red-100 text-red-900' :
                              alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-900' :
                              'bg-blue-100 text-blue-900'
                            }`}>
                              {alert.severity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 mb-2">{alert.message}</p>
                          {alert.remediationSteps && alert.remediationSteps.length > 0 && (
                            <div className="mt-3 bg-gray-50 p-3 rounded border border-gray-200">
                              <h5 className="text-xs font-semibold text-purple-700 mb-2">
                                Remediation Steps:
                              </h5>
                              <ol className="list-decimal list-inside text-xs text-gray-800 space-y-1">
                                {alert.remediationSteps.map((step: string, i: number) => (
                                  <li key={i}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-900 font-semibold">
                      ✓ No Issues Found - Your document meets all validation requirements!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
