"use client";

import React, { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ProfileSettings() {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDeleteAccount = async () => {
    if (!confirm("WARNING: This will permanently delete your account and all of your projects. This action cannot be undone. Are you sure you want to continue?")) {
      return;
    }
    
    try {
      setIsDeleting(true);
      
      const response = await fetch('/api/auth/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || `Server returned ${response.status}`);
      }
      
      alert('Your account has been successfully deleted. You will now be signed out.');
      signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert(`Failed to delete account: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 bg-secondary/30 rounded-xl border border-white/5">
      <h2 className="text-xl font-semibold mb-6">Settings</h2>
      
      <div className="space-y-8">
        <div>
          <h3 className="font-medium text-lg mb-4">Account</h3>
          <div className="grid gap-4">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-4 py-2 bg-black/40 hover:bg-black/60 rounded-md transition-colors text-white"
            >
              Sign Out
            </button>
            
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-800/40 hover:bg-red-800/60 rounded-md transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium text-lg mb-4">Appearance</h3>
          <div className="grid gap-4">
            <button
              disabled
              className="px-4 py-2 bg-black/40 rounded-md transition-colors text-white/50 cursor-not-allowed"
            >
              Dark Mode (Coming Soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 