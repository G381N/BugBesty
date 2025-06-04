import { useSession } from 'next-auth/react';
import { useEffect, ReactNode, useState } from 'react';
import { auth } from '@/lib/firebase';

/**
 * A utility hook to ensure the NextAuth session includes the Firebase user ID
 * This helps prevent Firestore permission errors
 */
export function useSessionSync() {
  const { data: session, update } = useSession();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateAttempts, setUpdateAttempts] = useState(0);
  const MAX_UPDATE_ATTEMPTS = 3;

  useEffect(() => {
    // Only run this effect if we have a session but no ID
    if (session?.user && !session.user.id && auth.currentUser && !isUpdating && updateAttempts < MAX_UPDATE_ATTEMPTS) {
      console.log('Session missing user ID, updating with Firebase Auth ID:', auth.currentUser.uid);
      
      setIsUpdating(true);
      
      // Update the session with the Firebase Auth user ID
      update({
        ...session,
        user: {
          ...session.user,
          id: auth.currentUser.uid
        }
      }).then(() => {
        console.log('Session successfully updated with Firebase Auth user ID');
        setIsUpdating(false);
      }).catch(error => {
        console.error('Failed to update session with Firebase Auth user ID:', error);
        setIsUpdating(false);
        setUpdateAttempts(prev => prev + 1);
      });
    }
  }, [session, update, isUpdating, updateAttempts]);
}

/**
 * A provider component that syncs the NextAuth session with Firebase Auth
 */
export function SessionSyncProvider({ children }: { children: ReactNode }) {
  useSessionSync();
  return <>{children}</>;
} 