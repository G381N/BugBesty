/**
 * This utility makes it easy to call our secure API endpoint from the client side
 * without exposing API keys in the browser.
 */

type ApiService = 
  | 'bevigil' 
  | 'binaryedge'
  | 'builtwith'
  | 'censys'
  | 'certspotter'
  | 'chaos'
  | 'fofa'
  | 'fullhunt'
  | 'github'
  | 'intelx'
  | 'leakix'
  | 'netlas'
  | 'securitytrails'
  | 'shodan'
  | 'gemini'
  | 'virustotal'
  | 'bolster';

interface ApiCallParams {
  service: ApiService;
  endpoint: string;
  params: any;
}

/**
 * Call an API securely through our server-side proxy
 * @param service The API service to use
 * @param endpoint The specific endpoint to call
 * @param params Any parameters to include in the request
 * @returns The API response
 */
export async function callSecureApi<T = any>(
  service: ApiService,
  endpoint: string,
  params: any = {}
): Promise<T> {
  try {
    const response = await fetch('/api/secure-apis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service,
        endpoint,
        params,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API call failed: ${response.status} ${response.statusText}` +
        (errorData.error ? ` - ${errorData.error}` : '')
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`Error calling ${service} API:`, error);
    throw error;
  }
}

// Example usage:
// 
// // Search GitHub repositories
// const searchGithub = async (query: string) => {
//   return callSecureApi('github', 'search/repositories', { q: query });
// };
//
// // Scan a domain with Shodan
// const scanWithShodan = async (domain: string) => {
//   return callSecureApi('shodan', 'dns/domain/' + domain, {});
// }; 