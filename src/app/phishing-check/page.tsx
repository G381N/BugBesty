"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface ScanResult {
  bolster: {
    status: string;
    disposition: string;
    brand?: string;
    jobID?: string;
  } | null;
  virusTotal: {
    status: string;
    stats: {
      malicious: number;
      harmless: number;
      suspicious: number;
    };
    scanId: string;
  } | null;
}

export default function PhishingCheck() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');

  const BOLSTER_API_KEY = process.env.NEXT_PUBLIC_BOLSTER_API_KEY;
  const VT_API_KEY = process.env.NEXT_PUBLIC_VIRUSTOTAL_API_KEY;

  const checkWithVirusTotal = async (urlToCheck: string) => {
    // Submit URL for scanning
    const submitResponse = await fetch('https://www.virustotal.com/api/v3/urls', {
      method: 'POST',
      headers: {
        'x-apikey': VT_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `url=${encodeURIComponent(urlToCheck)}`
    });

    const submitData = await submitResponse.json();
    const scanId = submitData.data.id;

    // Poll for results
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const resultResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${scanId}`, {
        headers: {
          'x-apikey': VT_API_KEY,
        },
      });

      const resultData = await resultResponse.json();
      
      if (resultData.data.attributes.status === 'completed') {
        return {
          status: 'completed',
          stats: resultData.data.attributes.stats,
          scanId
        };
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    throw new Error('VirusTotal scan timeout');
  };

  const checkWithBolster = async (urlToCheck: string) => {
    const submitResponse = await fetch('https://developers.bolster.ai/api/neo/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: BOLSTER_API_KEY,
        urlInfo: { url: urlToCheck },
        scanType: 'quick'
      })
    });

    const submitData = await submitResponse.json();
    
    if (!submitData.jobID) {
      throw new Error('Failed to initiate Bolster scan');
    }

    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const resultResponse = await fetch('https://developers.bolster.ai/api/neo/scan/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: BOLSTER_API_KEY,
          jobID: submitData.jobID,
          insights: true
        })
      });

      const resultData = await resultResponse.json();

      if (resultData.status === 'DONE') {
        return {
          ...resultData,
          jobID: submitData.jobID
        };
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    throw new Error('Bolster scan timeout');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const [bolsterResult, vtResult] = await Promise.all([
        checkWithBolster(url).catch(err => null),
        checkWithVirusTotal(url).catch(err => null)
      ]);

      setResult({
        bolster: bolsterResult,
        virusTotal: vtResult
      });
    } catch (err: any) {
      setError(err.message || 'Failed to check URL');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push('/dashboard')}
          className="mb-6 flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Dashboard</span>
        </motion.button>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-secondary/50 backdrop-blur-xl rounded-2xl p-8 border border-primary/20"
        >
          <h1 className="text-3xl font-bold text-primary mb-2">Phishing URL Check</h1>
          <p className="text-foreground/70 mb-8">
            Check if a URL is potentially malicious using multiple security services.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL to check (e.g., https://example.com)"
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-primary/20 
                  text-white focus:border-primary focus:ring-2 focus:ring-primary/20 
                  transition-all duration-300 group-hover:border-primary/40"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="w-full px-6 py-3 bg-primary text-white rounded-xl font-semibold
                hover:bg-primary/90 transition-all duration-300 
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Analyzing URL...</span>
                </div>
              ) : (
                'Check URL'
              )}
            </button>
          </form>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500"
            >
              {error}
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-4"
            >
              {/* Bolster Results */}
              {result.bolster && (
                <div className="p-6 bg-black/40 rounded-xl border border-primary/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Bolster Scan Results</h3>
                    <span className="text-sm text-primary/70">ID: {result.bolster.jobID}</span>
                  </div>

                  <div className={`flex items-center space-x-3 p-4 rounded-lg ${
                    result.bolster.disposition === 'clean' 
                      ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                      : result.bolster.disposition === 'suspicious'
                      ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                      : 'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {result.bolster.disposition === 'clean' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      )}
                    </svg>
                    <div>
                      <span className="font-medium capitalize block">
                        {result.bolster.disposition === 'clean' ? 'Safe to visit' : result.bolster.disposition}
                      </span>
                      {result.bolster.brand && (
                        <span className="text-sm opacity-80">
                          Targeted Brand: {result.bolster.brand}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* VirusTotal Results */}
              {result.virusTotal && (
                <div className="p-6 bg-black/40 rounded-xl border border-primary/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">VirusTotal Scan Results</h3>
                    <span className="text-sm text-primary/70">ID: {result.virusTotal.scanId}</span>
                  </div>

                  <div className={`p-4 rounded-lg ${
                    result.virusTotal.stats.malicious > 0
                      ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                      : result.virusTotal.stats.suspicious > 0
                      ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                      : 'bg-green-500/10 text-green-500 border border-green-500/20'
                  }`}>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{result.virusTotal.stats.malicious}</div>
                        <div className="text-sm opacity-80">Malicious</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{result.virusTotal.stats.suspicious}</div>
                        <div className="text-sm opacity-80">Suspicious</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{result.virusTotal.stats.harmless}</div>
                        <div className="text-sm opacity-80">Clean</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 