import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { handleApiError } from "../error-handler";

// This lightweight endpoint helps verify Firestore connection
export async function GET() {
  try {
    // Test Firestore connection by fetching a single document from any collection
    const testQuery = query(collection(db, "projects"), limit(1));
    await getDocs(testQuery);
    
    return NextResponse.json({ 
      status: "ok", 
      message: "Firestore connection is working",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to connect to Firestore:", error);
    return handleApiError(error);
  }
} 