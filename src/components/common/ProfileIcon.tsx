"use client";

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDocument } from '@/lib/firestore';
import { collection, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ProfileIconProps {
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export default function ProfileIcon({ size = 'md', showName = true }: ProfileIconProps) {
  const { data: session, update: updateSession } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [userData, setUserData] = useState<{ name?: string; email?: string } | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  
  // Profile editing states
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Fetch user data from Firestore
  useEffect(() => {
    async function fetchUserData() {
      if (session?.user?.email) {
        // Immediately set user data from session to prevent loading state
        setUserData({
          name: session.user.name || '',
          email: session.user.email
        });
        setIsLoadingUser(false);
        
        // Optional: Try to get additional data from Firestore, but don't show loading state
        try {
          console.log('Attempting to fetch additional user data from Firestore (optional)');
          // This may fail due to permissions, but we already have session data displayed
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', session.user.email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const firestoreData = userDoc.data();
            console.log('Found additional user data in Firestore:', firestoreData);
            
            // Only update if we got additional data
            if (firestoreData?.name) {
              setUserData(prev => ({
                ...prev,
                name: firestoreData.name
              }));
            }
          }
        } catch (error) {
          console.error('Error fetching additional Firestore data (non-critical):', error);
          // No need to do anything - we're already showing session data
        }
      }
    }
    
    fetchUserData();
    
    // No listener needed - just use session data
    return () => {};
  }, [session]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (showProfileModal) {
      setNewUsername(userData?.name || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setNameError('');
    }
  }, [showProfileModal, userData?.name]);

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      setNameError('Username cannot be empty');
      return;
    }

    setIsUpdating(true);
    setNameError('');

    try {
      const response = await fetch('/api/user/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newUsername.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update username');
      }

      // Update the local user data
      setUserData(prev => prev ? { ...prev, name: newUsername.trim() } : null);

      // Update the session with new user data
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: newUsername.trim()
        }
      });

      setShowProfileModal(false);
      setShowMenu(false);
    } catch (error: any) {
      setNameError(error.message || 'Failed to update username');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async () => {
    // Reset errors
    setPasswordError('');
    
    // Validate password
    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    
    if (!newPassword) {
      setPasswordError('New password is required');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setIsUpdatingPassword(true);
    
    try {
      const response = await fetch('/api/user/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentPassword, 
          newPassword 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }
      
      // Success - clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowProfileModal(false);
      alert('Password updated successfully');
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/login' });
  };

  const handleDeleteAccount = async () => {
    if (!confirm("WARNING: This will permanently delete your account and all of your projects. This action cannot be undone. Are you sure you want to continue?")) {
      return;
    }
    
    try {
      setIsUpdating(true);
      
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
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert(`Failed to delete account: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsUpdating(false);
    }
  };

  // Determine icon size
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12"
  };

  const fontSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  // Get user initial and name from Firestore data or session fallback
  const userInitial = userData?.name?.charAt(0)?.toUpperCase() || 
                     userData?.email?.charAt(0)?.toUpperCase() || 
                     session?.user?.name?.charAt(0)?.toUpperCase() || 
                     session?.user?.email?.charAt(0)?.toUpperCase() || 
                     'U';
                     
  const userName = userData?.name || session?.user?.name || 'User';
  const userEmail = userData?.email || session?.user?.email || '';

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center space-x-2 focus:outline-none"
      >
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary/80 to-primary/30 border border-primary/20 flex items-center justify-center transition-all hover:shadow-md hover:shadow-primary/20 hover:scale-105 relative`}>
          {isLoadingUser ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : (
            <span className={`${fontSizeClasses[size]} text-white font-medium`}>
              {userInitial}
            </span>
          )}
        </div>
        {showName && (
          <span className="hidden md:inline-block text-foreground text-sm font-medium">
            {isLoadingUser ? 'Loading...' : userName}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-secondary border border-white/10 z-50 overflow-hidden"
          >
            <div className="py-1">
              <div className="px-4 py-3 border-b border-white/10">
                <div className="font-medium text-foreground">{isLoadingUser ? 'Loading...' : userName}</div>
                <div className="text-sm text-foreground/60 truncate">{userEmail}</div>
              </div>
              <button
                onClick={() => {
                  setShowProfileModal(true);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 transition-colors duration-150 flex items-center"
              >
                <svg className="w-4 h-4 mr-2 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Edit Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 transition-colors duration-150 flex items-center"
              >
                <svg className="w-4 h-4 mr-2 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
              <button
                onClick={handleDeleteAccount}
                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors duration-150 flex items-center"
              >
                <svg className="w-4 h-4 mr-2 text-red-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Account
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Edit Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-secondary rounded-xl shadow-xl border border-white/10 p-6 max-w-md w-full"
            >
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Edit Profile</h2>
                
                {/* Tabs */}
                <div className="flex border-b border-white/10 mb-4">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'profile' 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-foreground/70 hover:text-foreground'
                    }`}
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => setActiveTab('password')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'password' 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-foreground/70 hover:text-foreground'
                    }`}
                  >
                    Change Password
                  </button>
                </div>
                
                {activeTab === 'profile' ? (
                  // Profile tab content
                  <div className="space-y-4">
                    {nameError && (
                      <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        {nameError}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder={userData?.name || session?.user?.name || 'Enter new username'}
                        className="w-full p-2 bg-background border border-white/10 rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                      />
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        onClick={() => setShowProfileModal(false)}
                        className="px-4 py-2 text-sm text-foreground/70 hover:text-foreground
                          border border-white/10 rounded-lg hover:border-white/20 transition-colors"
                        disabled={isUpdating}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateUsername}
                        disabled={isUpdating}
                        className={`px-4 py-2 text-sm bg-primary hover:bg-primary/90
                          text-white rounded-lg transition-colors flex items-center space-x-2
                          ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isUpdating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            <span>Updating...</span>
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Password tab content
                  <div className="space-y-4">
                    {passwordError && (
                      <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        {passwordError}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        className="w-full p-2 bg-background border border-white/10 rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full p-2 bg-background border border-white/10 rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full p-2 bg-background border border-white/10 rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                      />
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        onClick={() => setShowProfileModal(false)}
                        className="px-4 py-2 text-sm text-foreground/70 hover:text-foreground
                          border border-white/10 rounded-lg hover:border-white/20 transition-colors"
                        disabled={isUpdatingPassword}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdatePassword}
                        disabled={isUpdatingPassword}
                        className={`px-4 py-2 text-sm bg-primary hover:bg-primary/90
                          text-white rounded-lg transition-colors flex items-center space-x-2
                          ${isUpdatingPassword ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isUpdatingPassword ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            <span>Updating...</span>
                          </>
                        ) : (
                          'Change Password'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
} 