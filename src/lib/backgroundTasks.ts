import { v4 as uuidv4 } from "uuid";
import { addDoc, updateDoc, getDoc, doc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

// Task status constants
export const TASK_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
};

export interface Task {
  id: string;
  type: string;
  status: string;
  data: any;
  result?: any;
  error?: string;
  progress?: number;
  createdAt: number;
  updatedAt: number;
}

// Collection name
const TASKS_COLLECTION = 'tasks';

// Create a new task
export async function createTask(type: string, data: any): Promise<Task> {
  const taskId = uuidv4();
  const task: Task = {
    id: taskId,
    type,
    status: TASK_STATUS.PENDING,
    data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    progress: 0,
  };

  // Store task in Firestore
  await addDoc(collection(db, TASKS_COLLECTION), task);
  
  // For more advanced queue processing, you'd implement a Cloud Function 
  // or use Firebase Cloud Tasks/Pub Sub
  
  return task;
}

// Update a task's status and optional data
export async function updateTask(
  taskId: string, 
  status: string, 
  updates: Partial<Task> = {}
): Promise<Task> {
  const taskQuery = query(
    collection(db, TASKS_COLLECTION),
    where('id', '==', taskId)
  );
  
  const tasksSnapshot = await getDocs(taskQuery);
  
  if (tasksSnapshot.empty) {
    throw new Error(`Task ${taskId} not found`);
  }
  
  const taskDoc = tasksSnapshot.docs[0];
  const task = taskDoc.data() as Task;
  
  const updatedTask = {
    ...task,
    ...updates,
    status,
    updatedAt: Date.now(),
  };
  
  await updateDoc(doc(db, TASKS_COLLECTION, taskDoc.id), updatedTask);
  return updatedTask;
}

// Get a task by ID
export async function getTask(taskId: string): Promise<Task | null> {
  const taskQuery = query(
    collection(db, TASKS_COLLECTION),
    where('id', '==', taskId)
  );
  
  const tasksSnapshot = await getDocs(taskQuery);
  
  if (tasksSnapshot.empty) {
    return null;
  }
  
  return tasksSnapshot.docs[0].data() as Task;
}

// Update progress of a task
export async function updateTaskProgress(
  taskId: string, 
  progress: number, 
  partialResults?: any
): Promise<Task> {
  const updates: Partial<Task> = { progress };
  if (partialResults) {
    updates.result = partialResults;
  }
  return updateTask(taskId, TASK_STATUS.PROCESSING, updates);
} 