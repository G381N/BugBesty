import type { Metadata } from 'next';
import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Dashboard | BugBesty',
  description: 'Manage your vulnerability scanning projects',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <>
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-full">
            <div className="mt-6 space-y-6">
              {children}
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 