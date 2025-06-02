import { NextResponse } from "next/server";
import { createClient } from "@vercel/kv";
import axios from "axios";

// Initialize KV storage client with default values to avoid build errors
const kv = createClient({
  url: process.env.KV_REST_API_URL || "https://example.upstash.io",
  token: process.env.KV_REST_API_TOKEN || "example_token"
});

export async function GET(req: Request) {
  try {
    // Check authorization
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get next task from queue
    const taskId = await kv.rpop("task_queue");
    if (!taskId) {
      return NextResponse.json({ message: "No tasks in queue" });
    }

    // Process the task
    console.log(`Processing task ${taskId}`);
    
    // Make request to task processing API
    await axios.post(
      `${process.env.NEXTAUTH_URL}/api/tasks/process`,
      { taskId },
      {
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: `Task ${taskId} sent for processing`,
    });
  } catch (error) {
    console.error("Cron task processing error:", error);
    return NextResponse.json(
      { error: "Failed to process tasks" },
      { status: 500 }
    );
  }
} 