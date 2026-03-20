import { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { LeaveEventResponse } from '../types/leave-event';
import { api } from '../services/api';

const localizer = momentLocalizer(moment);

type EventType = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
};

export default function CalendarView() {
  const [events, setEvents] = useState<EventType[]>([]);

  useEffect(() => {
  const fetchEvents = async () => {
    try {
      const data: LeaveEventResponse[] = await api.getLeaveEvents();

      const formatted = data.map((e) => ({
        id: e.id,
        title: `${e.user?.name || 'Unknown'} - ${e.leaveType?.name || ''}`,
        start: new Date(e.startDate),
        end: new Date(e.endDate),
        color: e.leaveType?.color,
      }));

      setEvents(formatted);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  fetchEvents();
}, []);

  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      style={{ height: 600 }}
      eventPropGetter={(event) => ({
        style: {
          backgroundColor: event.color || '#3174ad',
        },
      })}
    />
  );
}