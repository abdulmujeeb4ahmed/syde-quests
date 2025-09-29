import { NextResponse } from 'next/server';
import questData from '../../../../data/quests.seed.json';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quest = questData.find(q => q.id === id);
    
    if (!quest) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(quest);
  } catch (error) {
    console.error('Error fetching quest:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quest' },
      { status: 500 }
    );
  }
}
