import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

// This API endpoint acts as a secure proxy for your third-party API calls
export async function POST(request: NextRequest) {
  // Verify the user is authenticated
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { service, endpoint, params } = await request.json();
    
    // Get the appropriate API key based on the requested service
    const apiKey = getApiKeyForService(service);
    if (!apiKey) {
      return NextResponse.json({ error: 'Service not supported' }, { status: 400 });
    }

    // Make the API call with the server-side API key
    const response = await makeApiCall(service, endpoint, apiKey, params);
    
    // Return the data to the client
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in secure API proxy:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Helper function to get the appropriate API key
function getApiKeyForService(service: string): string | null {
  switch (service.toLowerCase()) {
    case 'bevigil':
      return process.env.BEVIGIL_API_KEY || null;
    case 'binaryedge':
      return process.env.BINARYEDGE_API_KEY || null;
    case 'builtwith':
      return process.env.BUILTWITH_API_KEY || null;
    case 'censys':
      return process.env.CENSYS_API_ID || null; // Handle special case for Censys which needs both ID and secret
    case 'certspotter':
      return process.env.CERTSPOTTER_API_KEY || null;
    case 'chaos':
      return process.env.CHAOS_API_KEY || null;
    case 'fofa':
      return process.env.FOFA_API_KEY || null;
    case 'fullhunt':
      return process.env.FULLHUNT_API_KEY || null;
    case 'github':
      return process.env.GITHUB_API_KEY || null;
    case 'intelx':
      return process.env.INTELX_API_KEY || null;
    case 'leakix':
      return process.env.LEAKIX_API_KEY || null;
    case 'netlas':
      return process.env.NETLAS_API_KEY || null;
    case 'securitytrails':
      return process.env.SECURITYTRAILS_API_KEY || null;
    case 'shodan':
      return process.env.SHODAN_API_KEY || null;
    case 'gemini':
      return process.env.GEMINI_API_KEY || null;
    case 'virustotal':
      return process.env.VIRUSTOTAL_API_KEY || null;
    case 'bolster':
      return process.env.BOLSTER_API_KEY || null;
    default:
      return null;
  }
}

// Helper function to make the actual API call
// This is a placeholder - you'll need to implement the actual API calls based on your requirements
async function makeApiCall(service: string, endpoint: string, apiKey: string, params: any) {
  // Example implementation - modify based on your specific API requirements
  const url = getServiceEndpoint(service, endpoint);
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add the API key to headers or query parameters as required by each service
  if (service === 'github') {
    headers['Authorization'] = `token ${apiKey}`;
  } else if (service === 'shodan') {
    // For services that use query parameters for authentication
    const separator = url.includes('?') ? '&' : '?';
    return fetch(`${url}${separator}key=${apiKey}`, {
      method: 'GET',
      headers
    }).then(res => res.json());
  }

  // Default implementation for most APIs
  return fetch(url, {
    method: 'POST',
    headers: {
      ...headers,
      'Authorization': `Bearer ${apiKey}` // Most modern APIs use Bearer token auth
    },
    body: JSON.stringify(params)
  }).then(res => res.json());
}

// Helper to get the right endpoint URL based on the service and endpoint requested
function getServiceEndpoint(service: string, endpoint: string): string {
  // Map services to their base URLs
  const baseUrls: Record<string, string> = {
    'bevigil': 'https://osint.bevigil.com/api/',
    'binaryedge': 'https://api.binaryedge.io/v2/',
    'builtwith': 'https://api.builtwith.com/',
    'censys': 'https://search.censys.io/api/',
    'certspotter': 'https://api.certspotter.com/v1/',
    'chaos': 'https://api.chaos.projectdiscovery.io/v1/',
    'fofa': 'https://fofa.info/api/v1/',
    'fullhunt': 'https://fullhunt.io/api/v1/',
    'github': 'https://api.github.com/',
    'intelx': 'https://2.intelx.io/',
    'leakix': 'https://leakix.net/api/',
    'netlas': 'https://app.netlas.io/api/',
    'securitytrails': 'https://api.securitytrails.com/v1/',
    'shodan': 'https://api.shodan.io/',
    'gemini': 'https://generativelanguage.googleapis.com/',
    'virustotal': 'https://www.virustotal.com/api/v3/',
    'bolster': 'https://api.bolster.ai/'
  };

  return `${baseUrls[service.toLowerCase()]}${endpoint}`;
} 