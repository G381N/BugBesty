import { NextResponse } from 'next/server';
import { enumerationConfig } from '@/config/enumeration-config';
import { ProjectModel } from '@/models/Project';
import { SubdomainModel } from '@/models/Subdomain';
import { VulnerabilityModel } from '@/models/Vulnerability';
import { vulnerabilityTypes } from '@/constants/vulnerabilityTypes';
import { getServerSession } from 'next-auth';
import { getDocuments } from '@/lib/firestore';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import * as admin from 'firebase-admin';
import dns from 'dns';
import { promisify } from 'util';

// Promisify DNS lookup
const dnsLookup = promisify(dns.lookup);

// Function to check if subdomain exists using DNS lookup
async function checkSubdomainExists(subdomain: string): Promise<boolean> {
  try {
    await dnsLookup(subdomain);
    return true;
  } catch (error) {
    return false;
  }
}

async function fetchSubdomainsFromCertspotter(domain: string) {
  try {
    console.log('Fetching subdomains from Certspotter for:', domain);
    // For testing - mock the results with real patterns if API fails
    const mockSubdomains = [
      `www.${domain}`,
      `mail.${domain}`,
      `blog.${domain}`,
      `dev.${domain}`,
      `api.${domain}`,
      `m.${domain}`,
      `shop.${domain}`,
      `support.${domain}`,
      `portal.${domain}`
    ];
    
  try {
    const response = await fetch(
      `https://api.certspotter.com/v1/issuances?domain=${domain}&include_subdomains=true&expand=dns_names`,
      {
        headers: {
          Authorization: `Bearer ${enumerationConfig.certspotter}`
        }
      }
    );
      
      if (!response.ok) {
        console.warn(`Certspotter API returned non-OK status: ${response.status}, falling back to DNS verification`);
        
        // Use mock subdomains but verify them with DNS
        const verifiedSubdomains = new Set<string>();
        verifiedSubdomains.add(domain); // Always add main domain
        
        for (const mockSubdomain of mockSubdomains) {
          const exists = await checkSubdomainExists(mockSubdomain);
          if (exists) {
            console.log(`Verified subdomain exists: ${mockSubdomain}`);
            verifiedSubdomains.add(mockSubdomain);
          }
        }
        
        console.log(`Found ${verifiedSubdomains.size} verified subdomains after Certspotter API failed`);
        return Array.from(verifiedSubdomains);
      }
      
    const data = await response.json();
    const subdomains = new Set<string>();
    
    data.forEach((cert: any) => {
      cert.dns_names.forEach((name: string) => {
        if (name.endsWith(domain)) {
          subdomains.add(name);
        }
      });
    });
    
      console.log(`Found ${subdomains.size} subdomains from Certspotter`);
    return Array.from(subdomains);
  } catch (error) {
    console.error('Error fetching from Certspotter:', error);
      
      // Fallback to DNS verification
      const verifiedSubdomains = new Set<string>();
      verifiedSubdomains.add(domain); // Always add main domain
      
      for (const mockSubdomain of mockSubdomains) {
        const exists = await checkSubdomainExists(mockSubdomain);
        if (exists) {
          console.log(`Verified subdomain exists: ${mockSubdomain}`);
          verifiedSubdomains.add(mockSubdomain);
        }
      }
      
      console.log(`Found ${verifiedSubdomains.size} verified subdomains after Certspotter API error`);
      return Array.from(verifiedSubdomains);
    }
  } catch (error) {
    console.error('Error in Certspotter function:', error);
    return [domain]; // Always return at least the main domain
  }
}

async function fetchSubdomainsFromCensys(domain: string) {
  try {
    console.log('Fetching subdomains from Censys for:', domain);
    const API_ID = enumerationConfig.censys?.id;
    const API_SECRET = enumerationConfig.censys?.secret;
    
    // For testing - mock the results with real patterns if API fails
    const mockSubdomains = [
      `docs.${domain}`,
      `admin.${domain}`,
      `app.${domain}`,
      `auth.${domain}`,
      `help.${domain}`,
      `login.${domain}`,
      `remote.${domain}`,
      `vpn.${domain}`
    ];
    
    if (!API_ID || !API_SECRET) {
      console.warn('Censys API credentials not configured, falling back to DNS verification');
      
      // Fallback to DNS verification
      const verifiedSubdomains = new Set<string>();
      
      for (const mockSubdomain of mockSubdomains) {
        const exists = await checkSubdomainExists(mockSubdomain);
        if (exists) {
          console.log(`Verified subdomain exists: ${mockSubdomain}`);
          verifiedSubdomains.add(mockSubdomain);
        }
      }
      
      return Array.from(verifiedSubdomains);
    }
    
    try {
      const encodedAuth = Buffer.from(`${API_ID}:${API_SECRET}`).toString('base64');
      
    const response = await fetch(
        'https://search.censys.io/api/v1/search/certificates',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Basic ${encodedAuth}`
        },
        body: JSON.stringify({
          query: `parsed.names: ${domain}`,
            fields: ["parsed.names"],
          per_page: 100
        })
      }
    );
    
    if (!response.ok) {
        console.warn(`Censys API returned non-OK status: ${response.status}, falling back to DNS verification`);
        
        // Fallback to DNS verification
        const verifiedSubdomains = new Set<string>();
        
        for (const mockSubdomain of mockSubdomains) {
          const exists = await checkSubdomainExists(mockSubdomain);
          if (exists) {
            console.log(`Verified subdomain exists: ${mockSubdomain}`);
            verifiedSubdomains.add(mockSubdomain);
          }
        }
        
        console.log(`Found ${verifiedSubdomains.size} verified subdomains after Censys API failed`);
        return Array.from(verifiedSubdomains);
    }
    
    const data = await response.json();
    const subdomains = new Set<string>();
    
    if (data?.result?.hits && Array.isArray(data.result.hits)) {
      data.result.hits.forEach((hit: any) => {
        if (hit?.parsed?.names && Array.isArray(hit.parsed.names)) {
          hit.parsed.names.forEach((name: string) => {
            if (name && typeof name === 'string' && name.endsWith(domain)) {
              subdomains.add(name);
            }
          });
        }
      });
    }
    
      console.log(`Found ${subdomains.size} subdomains from Censys`);
    return Array.from(subdomains);
  } catch (error) {
    console.error('Error fetching from Censys:', error);
      
      // Fallback to DNS verification
      const verifiedSubdomains = new Set<string>();
      
      for (const mockSubdomain of mockSubdomains) {
        const exists = await checkSubdomainExists(mockSubdomain);
        if (exists) {
          console.log(`Verified subdomain exists: ${mockSubdomain}`);
          verifiedSubdomains.add(mockSubdomain);
        }
      }
      
      console.log(`Found ${verifiedSubdomains.size} verified subdomains after Censys API error`);
      return Array.from(verifiedSubdomains);
    }
  } catch (error) {
    console.error('Error in Censys function:', error);
    return [];
  }
}

async function fetchSubdomainsFromSecurityTrails(domain: string) {
  try {
    console.log('Fetching subdomains from SecurityTrails for:', domain);
    const API_KEY = process.env.SECURITYTRAILS_API_KEY;
    
    // For testing - mock the results with real patterns if API fails
    const mockSubdomains = [
      `news.${domain}`,
      `blog.${domain}`,
      `cdn.${domain}`,
      `media.${domain}`,
      `static.${domain}`,
      `events.${domain}`,
      `community.${domain}`
    ];
    
    if (!API_KEY) {
      console.warn('SecurityTrails API key not configured, falling back to DNS verification');
      
      // Fallback to DNS verification
      const verifiedSubdomains = new Set<string>();
      
      for (const mockSubdomain of mockSubdomains) {
        const exists = await checkSubdomainExists(mockSubdomain);
        if (exists) {
          console.log(`Verified subdomain exists: ${mockSubdomain}`);
          verifiedSubdomains.add(mockSubdomain);
        }
      }
      
      return Array.from(verifiedSubdomains);
    }
    
    try {
      const response = await fetch(
        `https://api.securitytrails.com/v1/domain/${domain}/subdomains`,
        {
          headers: {
            'APIKEY': API_KEY,
            'Accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        console.warn(`SecurityTrails API returned non-OK status: ${response.status}, falling back to DNS verification`);
        
        // Fallback to DNS verification
        const verifiedSubdomains = new Set<string>();
        
        for (const mockSubdomain of mockSubdomains) {
          const exists = await checkSubdomainExists(mockSubdomain);
          if (exists) {
            console.log(`Verified subdomain exists: ${mockSubdomain}`);
            verifiedSubdomains.add(mockSubdomain);
          }
        }
        
        console.log(`Found ${verifiedSubdomains.size} verified subdomains after SecurityTrails API failed`);
        return Array.from(verifiedSubdomains);
      }
      
      const data = await response.json();
      const subdomains = new Set<string>();
      
      if (data?.subdomains && Array.isArray(data.subdomains)) {
        data.subdomains.forEach((subdomain: string) => {
          subdomains.add(`${subdomain}.${domain}`);
        });
      }
      
      console.log(`Found ${subdomains.size} subdomains from SecurityTrails`);
      return Array.from(subdomains);
    } catch (error) {
      console.error('Error fetching from SecurityTrails:', error);
      
      // Fallback to DNS verification
      const verifiedSubdomains = new Set<string>();
      
      for (const mockSubdomain of mockSubdomains) {
        const exists = await checkSubdomainExists(mockSubdomain);
        if (exists) {
          console.log(`Verified subdomain exists: ${mockSubdomain}`);
          verifiedSubdomains.add(mockSubdomain);
        }
      }
      
      console.log(`Found ${verifiedSubdomains.size} verified subdomains after SecurityTrails API error`);
      return Array.from(verifiedSubdomains);
    }
  } catch (error) {
    console.error('Error in SecurityTrails function:', error);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const { domain } = await req.json();

    if (!domain) {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 }
      );
    }

    // Get the current user session and ID
    const session = await getServerSession();
    console.log('Enumeration API session:', session || 'No session found');
    
    // Validate authentication
    if (!session?.user) {
      console.error('No authenticated user found in session');
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Try to find user ID either from session or by email lookup
    let userId = session?.user?.id;
    let firebaseAuthId = null;
    
    console.log('Session user:', session.user);
    console.log('Session user ID:', userId);
    
    // Try to find Firebase Auth ID
    if (session?.user?.email) {
      try {
        console.log('Looking up Firebase Auth user by email:', session.user.email);
        
        // First try to find the user in Firebase Auth by email
        const authUser = await admin.auth().getUserByEmail(session.user.email)
          .catch((error) => {
            console.error('Error looking up Firebase Auth user by email:', error);
            return null;
          });
          
        if (authUser) {
          firebaseAuthId = authUser.uid;
          console.log('Found user in Firebase Auth by email:', firebaseAuthId);
        } else {
          console.log('User not found in Firebase Auth by email');
          
          // Fallback: Try to find user in Firestore by email
          const usersRef = admin.firestore().collection('users');
          const snapshot = await usersRef.where('email', '==', session.user.email).get();
          
          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            userId = userDoc.id;
            console.log('Found user in Firestore by email:', userId);
          } else {
            console.log('User not found in Firestore by email, checking session ID');
            
            if (userId) {
              console.log('Using session user ID:', userId);
            } else {
              // Last resort: Use Firebase Auth current user UID
              console.log('Creating new user document in Firestore');
              
              // If no user found, create a new user document with the email
              const newUserRef = admin.firestore().collection('users').doc();
              await newUserRef.set({
                email: session.user.email,
                name: session.user.name || 'User',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
              });
              
              userId = newUserRef.id;
              console.log('Created new user document with ID:', userId);
            }
          }
        }
      } catch (error) {
        console.error('Error checking Firebase Auth:', error);
        // Continue with userId from session if available
      }
    }
    
    // Determine effective user ID with appropriate fallbacks
    const effectiveUserId = firebaseAuthId || userId || 'anonymous-user';
    console.log('Using effective user ID for operations:', effectiveUserId);
    
    // Ensure we have a user ID of some kind
    if (effectiveUserId === 'anonymous-user') {
      console.warn('Using anonymous user ID as fallback');
    }
    
    console.log('Starting enumeration process for domain:', domain, 'user ID:', effectiveUserId);

    // Create a new project document using Firebase Admin (bypasses security rules)
    console.log('Creating new project document using Firebase Admin...');
    const projectRef = admin.firestore().collection('projects').doc();
    const projectId = projectRef.id;
    
    const projectData = {
      name: domain,
      targetDomain: domain,
      status: "active",
      owner: effectiveUserId, // Use the Firebase Auth ID
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    try {
      await projectRef.set(projectData);
      console.log('Project document created with ID:', projectId);
    } catch (error) {
      console.error('Error creating project using Firebase Admin:', error);
      throw error;
    }

    // Fetch subdomains from different sources
    const [
      certspotterSubdomains, 
      censysSubdomains,
      securityTrailsSubdomains,
    ] = await Promise.all([
      fetchSubdomainsFromCertspotter(domain).catch(error => {
        console.error('Error fetching from Certspotter:', error);
        return [];
      }),
      fetchSubdomainsFromCensys(domain).catch(error => {
        console.error('Error fetching from Censys:', error);
        return [];
      }),
      fetchSubdomainsFromSecurityTrails(domain).catch(error => {
        console.error('Error fetching from SecurityTrails:', error);
        return [];
      }),
    ]);
    
    // Always include the main domain
    let allSubdomains = new Set([domain]);
    
    // Add subdomains from all API sources
    try {
      if (Array.isArray(certspotterSubdomains)) {
        certspotterSubdomains.forEach(s => allSubdomains.add(s));
      }
      
      if (Array.isArray(censysSubdomains)) {
        censysSubdomains.forEach(s => allSubdomains.add(s));
      }
      
      if (Array.isArray(securityTrailsSubdomains)) {
        securityTrailsSubdomains.forEach(s => allSubdomains.add(s));
      }
    } catch (error) {
      console.error('Error processing subdomains:', error);
    }

    console.log(`Total unique subdomains found: ${allSubdomains.size}`);

    // Create subdomains using Firebase Admin
    const createdSubdomains = [];
    const subdomainsArray = Array.from(allSubdomains);
    
    // Use a batch for better performance
    const batch = admin.firestore().batch();
    
    for (const subdomain of subdomainsArray) {
      try {
        // Create subdomain document
        const subdomainRef = admin.firestore().collection('subdomains').doc();
        const subdomainId = subdomainRef.id;
        const subdomainData = {
          projectId: projectId,
        name: subdomain.trim(),
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        batch.set(subdomainRef, subdomainData);
        
        // Create vulnerabilities for this subdomain
        for (const vulnType of vulnerabilityTypes) {
          const vulnRef = admin.firestore().collection('vulnerabilities').doc();
          const vulnData = {
            subdomainId: subdomainId,
          type: vulnType.type,
            severity: vulnType.severity,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          batch.set(vulnRef, vulnData);
        }
        
        createdSubdomains.push({
          id: subdomainId,
          name: subdomain.trim()
        });
      } catch (error) {
        console.error('Error preparing subdomain batch:', error);
      }
    }
    
    // Commit the batch
    try {
      await batch.commit();
      console.log(`Created ${createdSubdomains.length} subdomains with vulnerabilities`);
    } catch (error) {
      console.error('Error committing batch:', error);
      throw error;
    }

    // Update project with subdomain count
    try {
      await projectRef.update({
      subdomainsCount: createdSubdomains.length,
    });
    } catch (error) {
      console.error('Error updating project count:', error);
    }

    return NextResponse.json({
      project: {
        id: projectId,
        name: domain,
        targetDomain: domain,
        status: "active",
        subdomainsCount: createdSubdomains.length,
      },
      subdomainsCount: createdSubdomains.length,
      message: 'Enumeration completed successfully'
    });

  } catch (error: any) {
    console.error('Error during enumeration:', error);
    return NextResponse.json({
      error: 'Failed to complete enumeration',
      details: error.message
    }, { status: 500 });
  }
} 