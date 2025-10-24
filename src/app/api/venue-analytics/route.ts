import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to detect device type from user agent
function getDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

// Generate or retrieve visitor ID from cookie
function getVisitorId(request: NextRequest): string {
  const existingId = request.cookies.get('visitor_id')?.value;
  if (existingId) return existingId;
  
  // Generate new visitor ID
  return `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate session ID
function getSessionId(request: NextRequest): string {
  const existingSession = request.cookies.get('session_id')?.value;
  if (existingSession) return existingSession;
  
  // Generate new session ID
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { venueId, action, actionValue } = body;

    if (!venueId) {
      return NextResponse.json(
        { error: 'Venue ID is required' },
        { status: 400 }
      );
    }

    // Get visitor and session IDs
    const visitorId = getVisitorId(request);
    const sessionId = getSessionId(request);
    
    // Get request metadata
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referer = request.headers.get('referer') || 'direct';
    const deviceType = getDeviceType(userAgent);

    // If this is a page view, track it
    if (!action || action === 'page_view') {
      // Use the PostgreSQL function to upsert the visit
      const { error: visitError } = await supabase.rpc('upsert_venue_visit', {
        p_venue_id: venueId,
        p_visitor_id: visitorId,
        p_session_id: sessionId,
        p_referrer: referer,
        p_user_agent: userAgent,
        p_device_type: deviceType
      });

      if (visitError) {
        console.error('Error tracking venue visit:', visitError);
        // Don't fail the request if analytics fails
      }

      // Update daily summary
      const today = new Date().toISOString().split('T')[0];
      const { error: summaryError } = await supabase.rpc('update_venue_analytics_summary', {
        p_venue_id: venueId,
        p_date: today
      });

      if (summaryError) {
        console.error('Error updating analytics summary:', summaryError);
      }
    }

    // If there's a specific action, track it
    if (action && action !== 'page_view') {
      const { error: actionError } = await supabase
        .from('venue_analytics_actions')
        .insert({
          venue_id: venueId,
          visitor_id: visitorId,
          session_id: sessionId,
          action_type: action,
          action_value: actionValue || null
        });

      if (actionError) {
        console.error('Error tracking venue action:', actionError);
      }
    }

    // Create response with updated cookies
    const response = NextResponse.json({ success: true });
    
    // Set visitor ID cookie (expires in 2 years)
    response.cookies.set('visitor_id', visitorId, {
      maxAge: 60 * 60 * 24 * 365 * 2,
      path: '/',
      sameSite: 'lax'
    });
    
    // Set session ID cookie (expires in 30 minutes)
    response.cookies.set('session_id', sessionId, {
      maxAge: 60 * 30,
      path: '/',
      sameSite: 'lax'
    });

    return response;
  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Don't fail the request if analytics fails
    return NextResponse.json({ success: false, error: 'Analytics tracking failed' }, { status: 200 });
  }
}

// GET endpoint to retrieve analytics for a venue
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const range = searchParams.get('range') || '30'; // Default to 30 days

    if (!venueId) {
      return NextResponse.json(
        { error: 'Venue ID is required' },
        { status: 400 }
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(range));

    // Get summary data
    const { data: summaryData, error: summaryError } = await supabase
      .from('venue_analytics_summary')
      .select('*')
      .eq('venue_id', venueId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (summaryError) {
      console.error('Error fetching analytics summary:', summaryError);
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    // Calculate totals
    const totals = summaryData.reduce((acc, day) => ({
      totalViews: acc.totalViews + day.total_views,
      uniqueVisitors: acc.uniqueVisitors + day.unique_visitors,
      mobileViews: acc.mobileViews + day.mobile_views,
      desktopViews: acc.desktopViews + day.desktop_views,
      tabletViews: acc.tabletViews + day.tablet_views
    }), {
      totalViews: 0,
      uniqueVisitors: 0,
      mobileViews: 0,
      desktopViews: 0,
      tabletViews: 0
    });

    // Get action counts
    const { data: actionsData, error: actionsError } = await supabase
      .from('venue_analytics_actions')
      .select('action_type')
      .eq('venue_id', venueId)
      .gte('created_at', startDate.toISOString());

    const actionCounts = actionsData?.reduce((acc: any, action: any) => {
      acc[action.action_type] = (acc[action.action_type] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      success: true,
      venueId,
      range: parseInt(range),
      totals,
      dailyData: summaryData,
      actions: actionCounts
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
