// Use server-side environment variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface ReportData {
  projectName: string;
  vulnerabilities: {
    subdomain: string;
    vulns: Array<{
      type: string;
      severity: string;
      timestamp: string;
    }>;
    userName?: string;
    receiverName?: string;
    email?: string;
  }[];
  reproductionSteps: string;
  additionalNotes: string;
}

// Create a fallback report when Gemini API is not available
function generateFallbackReport(data: ReportData): string {
  // Add current timestamp
  const currentDate = new Date().toLocaleString();
  
  // Extract contact information
  const userName = data.vulnerabilities[0]?.userName || 'Security Researcher';
  const receiverName = data.vulnerabilities[0]?.receiverName || 'Security Team';
  const email = data.vulnerabilities[0]?.email || '';

  // Build the report manually
  let report = `
SECURITY REPORT
---------------
Generated on: ${currentDate}

PROJECT: ${data.projectName}

RESEARCHER INFORMATION:
Name: ${userName}
Email: ${email}

RECIPIENT:
Name: ${receiverName}

EXECUTIVE SUMMARY:
This report contains a security assessment for ${data.projectName}. The assessment identified multiple vulnerabilities that require attention.

VULNERABILITIES FOUND:
${data.vulnerabilities.map(v => `
Subdomain: ${v.subdomain}
${v.vulns.map(vuln => `
- Type: ${vuln.type}
  Severity: ${vuln.severity}
  Found: ${vuln.timestamp}
`).join('')}
`).join('')}

STEPS TO REPRODUCE:
${data.reproductionSteps}

ADDITIONAL NOTES:
${data.additionalNotes}

RECOMMENDATIONS:
1. Address all high-severity vulnerabilities immediately.
2. Implement proper input validation and sanitization.
3. Conduct regular security assessments.
4. Keep all software and dependencies up to date.
5. Implement a security-focused code review process.

CONCLUSION:
The identified vulnerabilities present significant security risks that should be addressed according to their severity levels. We recommend implementing the suggested security measures to improve the overall security posture of the application.
`;

  return report;
}

export async function generateReport(data: ReportData): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.warn('Missing Gemini API key in environment variables, using fallback report generation');
    return generateFallbackReport(data);
  }

  try {
    // Add current timestamp
    const currentDate = new Date().toLocaleString();
    
    // Extract contact information
    const userName = data.vulnerabilities[0]?.userName || 'Security Researcher';
    const receiverName = data.vulnerabilities[0]?.receiverName || 'Security Team';
    const email = data.vulnerabilities[0]?.email || '';

    const prompt = `
      Generate a detailed, professional bug bounty report with the following information. Format it with clear sections, proper spacing, and include all the details provided.

      SECURITY REPORT
      ---------------
      Generated on: ${currentDate}

      PROJECT: ${data.projectName}

      RESEARCHER INFORMATION:
      Name: ${userName}
      Email: ${email}
      
      RECIPIENT:
      Name: ${receiverName}

      EXECUTIVE SUMMARY:
      Create a brief executive summary of the security assessment based on the vulnerability details below.

      VULNERABILITIES FOUND:
      ${data.vulnerabilities.map(v => `
      Subdomain: ${v.subdomain}
      ${v.vulns.map(vuln => `
      - Type: ${vuln.type}
        Severity: ${vuln.severity}
        Found: ${vuln.timestamp}
      `).join('\n')}
      `).join('\n')}

      STEPS TO REPRODUCE:
      ${data.reproductionSteps}

      ADDITIONAL NOTES:
      ${data.additionalNotes}

      RECOMMENDATIONS:
      Based on the vulnerabilities found, provide 3-5 specific recommendations to improve security.

      CONCLUSION:
      Provide a brief conclusion summarizing the overall security posture and next steps.

      Please format this as plain text with clear sections and spacing, and do not use any special formatting like "---" or "**". Use line breaks and spacing to organize the content clearly.
    `;

    console.log('Sending request to Gemini API with project:', data.projectName);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', response.status, errorData);
      console.log('Falling back to local report generation');
      return generateFallbackReport(data);
    }

    const result = await response.json();
    
    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content || !result.candidates[0].content.parts) {
      console.error('Unexpected Gemini API response format:', JSON.stringify(result));
      console.log('Falling back to local report generation');
      return generateFallbackReport(data);
    }
    
    console.log('Successfully generated report with Gemini API');
    return result.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Failed to generate report with API:', error);
    console.log('Falling back to local report generation');
    return generateFallbackReport(data);
  }
} 