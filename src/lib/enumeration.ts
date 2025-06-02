import axios from "axios";

// Get API keys from environment variables
const API_KEYS = {
  BEVIGIL: process.env.NEXT_PUBLIC_BEVIGIL_API_KEY,
  BINARYEDGE: process.env.NEXT_PUBLIC_BINARYEDGE_API_KEY,
  BUILTWITH: process.env.NEXT_PUBLIC_BUILTWITH_API_KEY,
  CENSYS_ID: process.env.NEXT_PUBLIC_CENSYS_API_ID,
  CENSYS_SECRET: process.env.NEXT_PUBLIC_CENSYS_API_SECRET,
  CERTSPOTTER: process.env.NEXT_PUBLIC_CERTSPOTTER_API_KEY,
  CHAOS: process.env.NEXT_PUBLIC_CHAOS_API_KEY,
  FOFA: process.env.NEXT_PUBLIC_FOFA_API_KEY,
  FULLHUNT: process.env.NEXT_PUBLIC_FULLHUNT_API_KEY,
  GITHUB: process.env.NEXT_PUBLIC_GITHUB_API_KEY,
  INTELX: process.env.NEXT_PUBLIC_INTELX_API_KEY,
  LEAKIX: process.env.NEXT_PUBLIC_LEAKIX_API_KEY,
  NETLAS: process.env.NEXT_PUBLIC_NETLAS_API_KEY,
  SECURITYTRAILS: process.env.NEXT_PUBLIC_SECURITYTRAILS_API_KEY,
  SHODAN: process.env.NEXT_PUBLIC_SHODAN_API_KEY,
};

// Define API source handler type
type ApiHandler = (domain: string) => Promise<string[]>;

// Define API sources
const API_SOURCES: Array<{ name: string; handler: ApiHandler }> = [
  { name: "securitytrails", handler: fetchFromSecurityTrails },
  { name: "censys", handler: fetchFromCensys },
  { name: "certspotter", handler: fetchFromCertSpotter },
  { name: "crtsh", handler: fetchFromCrtSh }
  // Add more handlers as they are implemented
];

// Main enumeration function that processes APIs in chunks
export async function enumerateSubdomains(
  domain: string,
  startFrom: number = 0,
  chunkSize: number = 5
): Promise<{ subdomains: string[]; completedApis: number }> {
  const results: string[] = [];
  const endAt = Math.min(startFrom + chunkSize, API_SOURCES.length);
  
  // Process only a chunk of APIs
  for (let i = startFrom; i < endAt; i++) {
    try {
      const source = API_SOURCES[i];
      console.log(`Fetching from ${source.name} for ${domain}`);
      
      const sourceResults = await source.handler(domain);
      if (sourceResults && sourceResults.length) {
        results.push(...sourceResults);
      }
    } catch (error) {
      console.error(`Error fetching from source ${i}:`, error);
      // Continue with other sources even if one fails
    }
  }
  
  // Deduplicate results
  const uniqueSubdomains = [...new Set(results)];
  
  return {
    subdomains: uniqueSubdomains,
    completedApis: endAt,
  };
}

// Implementation of individual API handlers
async function fetchFromSecurityTrails(domain: string): Promise<string[]> {
  if (!API_KEYS.SECURITYTRAILS) return [];
  
  try {
    const response = await axios.get(
      `https://api.securitytrails.com/v1/domain/${domain}/subdomains`,
      {
        headers: {
          'APIKEY': API_KEYS.SECURITYTRAILS,
        },
        timeout: 10000,
      }
    );
    
    if (response.data && response.data.subdomains) {
      return response.data.subdomains.map((sub: string) => `${sub}.${domain}`);
    }
    return [];
  } catch (error: any) {
    console.error("SecurityTrails API error:", error.message);
    return [];
  }
}

// Implement other API handlers similarly
async function fetchFromCensys(domain: string): Promise<string[]> {
  if (!API_KEYS.CENSYS_ID || !API_KEYS.CENSYS_SECRET) return [];
  
  try {
    const response = await axios.get(
      `https://search.censys.io/api/v1/search/certificates`,
      {
        params: {
          q: `parsed.names: ${domain}`,
          fields: ['parsed.names'],
          per_page: 100,
        },
        auth: {
          username: API_KEYS.CENSYS_ID,
          password: API_KEYS.CENSYS_SECRET,
        },
        timeout: 10000,
      }
    );
    
    const subdomains: string[] = [];
    if (response.data && response.data.results) {
      response.data.results.forEach((result: any) => {
        if (result.parsed && result.parsed.names) {
          result.parsed.names.forEach((name: string) => {
            if (name.endsWith(domain) && name !== domain) {
              subdomains.push(name);
            }
          });
        }
      });
    }
    
    return subdomains;
  } catch (error: any) {
    console.error("Censys API error:", error.message);
    return [];
  }
}

// Add the implementation for fetchFromCertSpotter after fetchFromCensys
async function fetchFromCertSpotter(domain: string): Promise<string[]> {
  if (!API_KEYS.CERTSPOTTER) return [];
  
  try {
    const response = await axios.get(
      `https://api.certspotter.com/v1/issuances`,
      {
        params: {
          domain,
          include_subdomains: 'true',
          expand: 'dns_names',
        },
        headers: {
          'Authorization': `Bearer ${API_KEYS.CERTSPOTTER}`,
        },
        timeout: 10000,
      }
    );
    
    const subdomains: string[] = [];
    if (response.data && Array.isArray(response.data)) {
      response.data.forEach((cert: any) => {
        if (cert.dns_names && Array.isArray(cert.dns_names)) {
          cert.dns_names.forEach((name: string) => {
            if (name.endsWith(domain) && name !== domain) {
              subdomains.push(name);
            }
          });
        }
      });
    }
    
    return subdomains;
  } catch (error: any) {
    console.error("CertSpotter API error:", error.message);
    return [];
  }
}

// Simple function to fetch from Certificate Transparency logs (crt.sh)
async function fetchFromCrtSh(domain: string): Promise<string[]> {
  try {
    const response = await axios.get(
      `https://crt.sh/?q=${domain}&output=json`,
      { timeout: 10000 }
    );
    
    const subdomains: string[] = [];
    if (response.data) {
      response.data.forEach((cert: any) => {
        if (cert.name_value) {
          cert.name_value.split('\n').forEach((name: string) => {
            if (name.endsWith(domain) && name !== domain) {
              subdomains.push(name);
            }
          });
        }
      });
    }
    
    return subdomains;
  } catch (error: any) {
    console.error("crt.sh API error:", error.message);
    return [];
  }
}

// Continue implementing other API functions...
// For brevity, I'm not including all implementations, but you would need to implement each one 