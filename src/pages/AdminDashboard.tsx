import { useEffect, useState } from 'react';
import CalendarView from '../components/CalendarView';
import type { LeaveEventResponse } from '../types/leave-event';
import { api } from '../services/api';

export default function AdminDashboard() {
  const [events, setEvents] = useState<LeaveEventResponse[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchEvents = async () => {
      try {
        const data = await api.getLeaveEvents();
        if (isMounted) setEvents(data);
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    };

    fetchEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  const approve = async (id: string) => {
    try {
      await api.approveLeave(id);
      // refresh
      const data = await api.getLeaveEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    }
  };

  const reject = async (id: string) => {
    try {
      await api.rejectLeave(id);
      // refresh
      const data = await api.getLeaveEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Admin Dashboard</h1>

      <h2>Kalendar odsustava</h2>
      <CalendarView />

      <h2>Lista odsustava</h2>

      {events.map(e => (
        <div
          key={e.id}
          style={{
            border: '1px solid #ccc',
            padding: 10,
            marginBottom: 10,
            borderRadius: 8,
          }}
        >
          <strong>
            {e.user?.name || 'Unknown'} - {e.leaveType?.name || ''}
          </strong>
          <p>
            {e.startDate} → {e.endDate}
          </p>
          <p>Status: {e.status}</p>

          {e.status === 'PENDING' && (
            <div>
              <button onClick={() => approve(e.id)}>Approve</button>
              <button onClick={() => reject(e.id)}>Reject</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}