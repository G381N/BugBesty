import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function authMiddleware(request: NextRequest) {
  const token = await getToken({ req: request });

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}

// Helper function to check if a user has access to a project
export async function checkProjectAccess(projectId: string, userId: string) {
  const project = await Project.findOne({ _id: projectId, userId });
  return !!project;
}

// Helper function to check if a user has access to a subdomain
export async function checkSubdomainAccess(subdomainId: string, userId: string) {
  const subdomain = await Subdomain.findById(subdomainId).populate({
    path: 'projectId',
    select: 'userId'
  });

  return subdomain?.projectId?.userId?.toString() === userId;
} 