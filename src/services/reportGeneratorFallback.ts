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

/**
 * Generates a report without using the Gemini API.
 * This is a fallback method when the API key is not configured or when API requests fail.
 */
export function generateFallbackReport(data: ReportData): string {
  // Add current timestamp
  const currentDate = new Date().toLocaleString();
  
  // Extract contact information
  const userName = data.vulnerabilities[0]?.userName || 'Security Researcher';
  const receiverName = data.vulnerabilities[0]?.receiverName || 'Security Team';
  const email = data.vulnerabilities[0]?.email || '';

  // Count vulnerabilities by severity
  const severityCounts = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0
  };
  
  // Calculate statistics
  let totalVulns = 0;
  data.vulnerabilities.forEach(v => {
    v.vulns.forEach(vuln => {
      totalVulns++;
      if (vuln.severity in severityCounts) {
        severityCounts[vuln.severity as keyof typeof severityCounts]++;
      }
    });
  });

  // Build the report manually
  let report = `
SECURITY REPORT
===============
Generated on: ${currentDate}

PROJECT: ${data.projectName}

RESEARCHER INFORMATION
---------------------
Name: ${userName}
Email: ${email}

RECIPIENT
--------
Name: ${receiverName}

EXECUTIVE SUMMARY
----------------
This security assessment for ${data.projectName} identified ${totalVulns} vulnerabilities across ${data.vulnerabilities.length} subdomains. 
The assessment found ${severityCounts.Critical} critical, ${severityCounts.High} high, ${severityCounts.Medium} medium, and ${severityCounts.Low} low severity issues.
Immediate attention is recommended for all high and critical severity vulnerabilities.

VULNERABILITIES FOUND
--------------------
${data.vulnerabilities.map(v => `
Subdomain: ${v.subdomain}
${v.vulns.map(vuln => `
- Type: ${vuln.type}
  Severity: ${vuln.severity}
  Found: ${vuln.timestamp}
`).join('')}
`).join('')}

STEPS TO REPRODUCE
----------------
${data.reproductionSteps || "No reproduction steps provided."}

ADDITIONAL NOTES
--------------
${data.additionalNotes || "No additional notes provided."}

RECOMMENDATIONS
-------------
1. Address all high-severity vulnerabilities immediately.
2. Implement proper input validation and sanitization.
3. Conduct regular security assessments.
4. Keep all software and dependencies up to date.
5. Implement a security-focused code review process.

CONCLUSION
---------
The identified vulnerabilities present security risks that should be addressed according to their severity levels. 
We recommend implementing the suggested security measures to improve the overall security posture of the application.
`;

  return report;
} 