import { NextResponse } from 'next/server';

export function handleApiError(error: any) {
  console.error('API Error:', error);
  
  // Common error types
  if (error.name === 'MongooseServerSelectionError') {
    return NextResponse.json({ 
      error: 'Database connection failed', 
      message: 'Unable to connect to the database. Please try again later.'
    }, { status: 503 });
  }
  
  if (error.message === 'Database query timeout') {
    return NextResponse.json({ 
      error: 'Database timeout', 
      message: 'The operation took too long to complete. Please try again.' 
    }, { status: 504 });
  }
  
  if (error.name === 'ValidationError') {
    return NextResponse.json({ 
      error: 'Validation error', 
      message: error.message 
    }, { status: 400 });
  }
  
  // Generic error fallback
  return NextResponse.json({ 
    error: 'Server error', 
    message: 'An unexpected error occurred' 
  }, { status: 500 });
} 