import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getDocuments, deleteDocument } from '@/lib/firestore';
import { User, UserModel } from '@/models/User';
import { Project } from '@/models/Project';
import { Subdomain } from '@/models/Subdomain';
import { Vulnerability } from '@/models/Vulnerability';
import { auth } from '@/lib/firebase';
import { Session } from 'next-auth';

interface CustomSession extends Session {
  user: {
    id?: string;
    name?: string;
    email?: string;
  };
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions as any) as CustomSession | null;
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Background deletion process, so it doesn't block the response
    Promise.resolve().then(async () => {
      try {
        // Get all user's projects by owner field
        const projects = await getDocuments<Project>('projects', {
          fieldPath: 'owner',
          operator: '==',
          value: userEmail
        });

        console.log(`Starting deletion of ${projects.length} projects for user ${userEmail}`);

        // Delete all associated data for each project
        for (const project of projects) {
          const subdomains = await getDocuments<Subdomain>('subdomains', {
            fieldPath: 'projectId',
            operator: '==',
            value: project.id
          });
          
          for (const subdomain of subdomains) {
            // Delete vulnerabilities for this subdomain
            const vulnerabilities = await getDocuments<Vulnerability>('vulnerabilities', {
              fieldPath: 'subdomainId',
              operator: '==',
              value: subdomain.id
            });
            
            for (const vulnerability of vulnerabilities) {
              await deleteDocument('vulnerabilities', vulnerability.id);
            }
            
            // Delete the subdomain
            await deleteDocument('subdomains', subdomain.id);
          }
          
          // Delete the project
          await deleteDocument('projects', project.id);
        }

        // Get the user document to delete
        const users = await getDocuments<User>('users', {
          fieldPath: 'email',
          operator: '==',
          value: userEmail
        });

        if (users && users.length > 0) {
          // Delete the user document
          await deleteDocument('users', users[0].id);
          console.log(`User document deleted for ${userEmail}`);
        }

        // Try to delete the user from Firebase Authentication if a current user is available
        try {
          const currentUser = auth.currentUser;
          if (currentUser) {
            await currentUser.delete();
            console.log(`Firebase Auth user deleted for ${userEmail}`);
          } else {
            console.log(`No current user found in Firebase Auth context`);
          }
        } catch (authError) {
          console.error('Error deleting Firebase Auth user:', authError);
          // Continue with deletion - the user may need to reauthenticate
        }

        console.log(`Account deletion completed for ${userEmail}`);
      } catch (error) {
        console.error('Error in background account deletion process:', error);
      }
    });

    return NextResponse.json({ message: 'Account deletion initiated successfully' });
  } catch (error) {
    console.error('Error initiating account deletion:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
} 