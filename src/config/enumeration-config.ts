// This config now uses server-side environment variables without NEXT_PUBLIC_ prefix
export const enumerationConfig = {
  bevigil: process.env.BEVIGIL_API_KEY,
  binaryedge: process.env.BINARYEDGE_API_KEY,
  builtwith: process.env.BUILTWITH_API_KEY,
  censys: {
    id: process.env.CENSYS_API_ID,
    secret: process.env.CENSYS_API_SECRET
  },
  certspotter: process.env.CERTSPOTTER_API_KEY,
  chaos: process.env.CHAOS_API_KEY,
  fofa: process.env.FOFA_API_KEY,
  fullhunt: process.env.FULLHUNT_API_KEY,
  github: process.env.GITHUB_API_KEY,
  intelx: process.env.INTELX_API_KEY,
  leakix: process.env.LEAKIX_API_KEY,
  netlas: process.env.NETLAS_API_KEY,
  securitytrails: process.env.SECURITYTRAILS_API_KEY,
  shodan: process.env.SHODAN_API_KEY,
  virustotal: process.env.VIRUSTOTAL_API_KEY,
  bolster: process.env.BOLSTER_API_KEY,
  gemini: process.env.GEMINI_API_KEY
}; 