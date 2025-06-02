import { NextResponse } from 'next/server';
import { TrainingContentModel } from '@/models/TrainingContent';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const content = await TrainingContentModel.findById(params.id);
    
    if (!content) {
      return NextResponse.json({ error: 'Training content not found' }, { status: 404 });
    }
    
    return NextResponse.json(content);
  } catch (error) {
    console.error('Failed to fetch training content:', error);
    return NextResponse.json({ error: 'Failed to fetch training content' }, { status: 500 });
  }
} 