import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface TimelineEvent {
  time: string;
  type: string;
  description: string;
  location?: string;
  metadata?: any;
}

interface StaffMovementData {
  staffId: string;
  date: string;
  totalActivities: number;
  timeline: TimelineEvent[];
  orderCount: number;
  salesCount: number;
}

interface StaffMovementTimelineProps {
  staffId?: string;
  date?: string;
}

const getActivityIcon = (activityType: string): string => {
  const type = activityType.toLowerCase();
  if (type.includes('order')) return '📋';
  if (type.includes('payment') || type.includes('sale')) return '💳';
  if (type.includes('clock')) return '🕐';
  if (type.includes('kitchen')) return '👨‍🍳';
  if (type.includes('bar')) return '🍹';
  return '📍';
};

const getActivityColor = (activityType: string): string => {
  const type = activityType.toLowerCase();
  if (type.includes('order')) return 'bg-blue-50 border-blue-200 text-blue-700';
  if (type.includes('payment') || type.includes('sale')) return 'bg-green-50 border-green-200 text-green-700';
  if (type.includes('clock')) return 'bg-purple-50 border-purple-200 text-purple-700';
  if (type.includes('kitchen')) return 'bg-orange-50 border-orange-200 text-orange-700';
  if (type.includes('bar')) return 'bg-amber-50 border-amber-200 text-amber-700';
  return 'bg-gray-50 border-gray-200 text-gray-700';
};

const StaffMovementTimeline: React.FC<StaffMovementTimelineProps> = ({ staffId, date }) => {
  const { token } = useAuth();
  const [timeline, setTimeline] = useState<StaffMovementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStaffId, setSelectedStaffId] = useState(staffId || '');
  const [selectedDate, setSelectedDate] = useState(date || new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (token && selectedStaffId && selectedDate) {
      fetchTimeline();
    }
  }, [token, selectedStaffId, selectedDate]);

  const fetchTimeline = async () => {
    if (!selectedStaffId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/owner/activity/staff/${selectedStaffId}?date=${selectedDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setTimeline(data);
    } catch (error) {
      console.error('Error fetching timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedStaffId) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Staff Movement Timeline</h2>
        <p className="text-gray-500 text-center py-8">Select a staff member to view their timeline</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Staff Movement Timeline</h2>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Staff Member</label>
          <input
            type="text"
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            placeholder="Enter staff ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading timeline...</div>
      ) : timeline && timeline.timeline.length > 0 ? (
        <div>
          {/* Summary Stats */}
          <div className="mb-6 grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-xs text-gray-600 uppercase font-semibold">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900">{timeline.totalActivities}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase font-semibold">Orders Processed</p>
              <p className="text-2xl font-bold text-blue-600">{timeline.orderCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase font-semibold">Payments Received</p>
              <p className="text-2xl font-bold text-green-600">{timeline.salesCount}</p>
            </div>
          </div>

          {/* Timeline Events */}
          <div className="space-y-4">
            {timeline.timeline.map((event, idx) => {
              const eventTime = new Date(event.time);
              const formattedTime = eventTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div key={idx} className={`border-l-4 pl-4 py-3 rounded-r-lg ${getActivityColor(event.type)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getActivityIcon(event.type)}</span>
                        <span className="font-semibold text-gray-900 capitalize">
                          {event.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{event.description}</p>
                      {event.location && (
                        <p className="text-xs text-gray-600 mt-1">📍 {event.location}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-semibold text-gray-700">{formattedTime}</p>
                      {event.metadata && event.metadata.table_number && (
                        <p className="text-xs text-gray-600">Table {event.metadata.table_number}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No activities found for this staff member on {selectedDate}</p>
        </div>
      )}
    </div>
  );
};

export default StaffMovementTimeline;
