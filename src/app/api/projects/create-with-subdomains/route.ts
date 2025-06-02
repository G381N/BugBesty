import { NextResponse } from 'next/server';
import { getDocuments, getDocument } from '@/lib/firestore';
import { Project, ProjectModel } from '@/models/Project';
import { Subdomain, SubdomainModel } from '@/models/Subdomain';
import { Vulnerability, VulnerabilityModel } from '@/models/Vulnerability';
import { vulnerabilityTypes } from '@/constants/vulnerabilityTypes';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(request: Request) {
  let project = null;
  let createdSubdomains: any[] = [];

  try {
    // Get the user session
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { name, subdomains } = body;

    if (!name || !subdomains || !Array.isArray(subdomains)) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: 'Name and subdomains array are required' 
      }, { status: 400 });
    }

    // Check if active project exists with same name
    const existingProjects = await getDocuments<Project>('projects', {
      fieldPath: 'name',
      operator: '==',
      value: name
    });
    
    const activeProjects = existingProjects.filter(p => p.status === 'active');
    
    if (activeProjects.length > 0) {
      const existingProject = activeProjects[0];
      
      const existingSubdomains = await getDocuments<Subdomain>('subdomains', {
        fieldPath: 'projectId',
        operator: '==',
        value: existingProject.id
      });
      
      if (existingSubdomains.length > 0) {
        return NextResponse.json({ 
          error: 'Project exists', 
          details: 'An active project with this name already exists' 
        }, { status: 409 });
      }

      // Archive the existing project
      await ProjectModel.update(existingProject.id, { status: 'archived' });
    }

    // Get user ID from email
    const users = await getDocuments<any>('users', {
      fieldPath: 'email',
      operator: '==',
      value: session.user.email
    });
    
    if (users.length === 0) {
      return NextResponse.json({ 
        error: 'User not found', 
        details: 'Could not find user profile in database' 
      }, { status: 404 });
    }
    
    const userId = users[0].id;

    // Create new project with owner
    const now = new Date();
    project = await ProjectModel.create({
      name,
      targetDomain: name,
      status: 'active',
      owner: userId,
      team: []
    });

    // Process subdomains
    const validSubdomains = subdomains.filter((subdomain: string) => 
      subdomain && subdomain.trim().length > 0
    );

    // Create subdomains and vulnerabilities
    for (const subdomain of validSubdomains) {
      const newSubdomain = await SubdomainModel.create({
        projectId: project.id,
        name: subdomain.trim()
      });

      // Create vulnerabilities
      for (const vulnType of vulnerabilityTypes) {
        await VulnerabilityModel.create({
          subdomainId: newSubdomain.id,
          type: vulnType.type,
          severity: vulnType.severity as 'Low' | 'Medium' | 'High' | 'Critical'
        });
      }

      createdSubdomains.push(newSubdomain);
    }

    // Update project with subdomain count
    await ProjectModel.update(project.id, {
      subdomainsCount: validSubdomains.length
    });

    return NextResponse.json({
      project,
      subdomains: createdSubdomains,
      message: 'Project and subdomains created successfully'
    });

  } catch (error: any) {
    console.error('Error creating project with subdomains:', error);
    
    return NextResponse.json({ 
      error: 'Failed to create project with subdomains',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
} 