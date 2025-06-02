import { NextResponse } from 'next/server';
import { TrainingContentModel } from '@/models/TrainingContent';

export async function GET() {
  try {
    const content = await TrainingContentModel.findAll();
    // Sort by createdAt DESC
    content.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
    return NextResponse.json(content);
  } catch (error) {
    console.error('Failed to fetch training content:', error);
    return NextResponse.json({ error: 'Failed to fetch training content' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const content = await TrainingContentModel.create(data);
    return NextResponse.json(content);
  } catch (error) {
    console.error('Failed to create training content:', error);
    return NextResponse.json({ error: 'Failed to create training content' }, { status: 500 });
  }
} 