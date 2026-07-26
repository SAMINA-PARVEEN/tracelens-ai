import { NextResponse } from 'next/server';
import { getTimelineEvents, getEventTypeIcon } from '@/app/lib/timelineService';

export async function GET() {
  try {
    const events = getTimelineEvents();
    const count = getEventCount();
    const countsByType = getEventCountByType();
    
    return NextResponse.json({
      success: true,
      totalEvents: count,
      countsByType,
      events: events.slice(0, 10), // Return only first 10 for preview
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}