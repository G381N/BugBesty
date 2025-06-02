import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Session } from 'next-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential, updateProfile } from 'firebase/auth';

interface CustomSession extends Session {
  user: {
    id?: string;
    name?: string;
    email?: string;
  };
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions as any) as CustomSession | null;
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // Handle username update
    if (data.name !== undefined) {
      const name = data.name;
      if (!name?.trim()) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }
      
      // Find user by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', session.user.email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      // Update the user in Firestore
      await updateDoc(doc(db, 'users', userDoc.id), {
        name: name.trim(),
        updatedAt: new Date().toISOString()
      });

      return NextResponse.json({
        user: {
          ...userData,
          name: name.trim(),
          updatedAt: new Date().toISOString()
        },
        message: 'Username updated successfully'
      });
    }
    
    // Handle password update
    if (data.currentPassword && data.newPassword) {
      const { currentPassword, newPassword } = data;
      
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ 
          error: 'New password must be at least 6 characters long' 
        }, { status: 400 });
      }
      
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
      }
      
      try {
        // Re-authenticate the user
        const credential = EmailAuthProvider.credential(user.email!, currentPassword);
        await reauthenticateWithCredential(user, credential);
        
        // Update the password
        await updatePassword(user, newPassword);
        
        return NextResponse.json({
          message: 'Password updated successfully'
        });
      } catch (error: any) {
        if (error.code === 'auth/wrong-password') {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }
        throw error;
      }
    }

    return NextResponse.json({ error: 'No valid update data provided' }, { status: 400 });
  } catch (error: any) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 