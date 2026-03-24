import { Calendar, momentLocalizer } from 'react-big-calendar';
import type { Event as BigCalendarEvent } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useEffect, useState } from 'react';
import type { LeaveEventResponse } from '../types/leave-event';
import { api } from '../services/api';

const localizer = momentLocalizer(moment);

type EventType = BigCalendarEvent & {
  color?: string;
  userName?: string;
  note?: string;
};

interface CalendarViewProps {
  events?: LeaveEventResponse[];
}

export default function CalendarView({ events: initialEvents }: CalendarViewProps) {
  const [events, setEvents] = useState<EventType[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data: LeaveEventResponse[] = initialEvents || await api.getLeaveEvents();

        const today = new Date();
        const formatted = data
          .filter(e => new Date(e.endDate) >= today) // samo buduci datumi
          .map(e => ({
            id: e.id,
            title: `${e.user?.name || 'Unknown'} - ${e.leaveType?.name || ''}`,
            start: new Date(e.startDate),
            end: new Date(e.endDate),
            color: e.leaveType?.color,
            userName: e.user?.name,
            note: e.note,
          }));

        setEvents(formatted);
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    };

    fetchEvents();
  }, [initialEvents]);

  const eventStyleGetter = (event: EventType) => ({
    style: {
      backgroundColor: event.color || '#3174ad',
      color: '#fff',
      borderRadius: 4,
      border: 'none',
      padding: 2,
    },
  });

  const dayPropGetter = (date: Date) => {
    const today = new Date();
    if (date < today) {
      return { style: { backgroundColor: '#f0f0f0', color: '#999' } }; // prošli datumi zasivljeni
    }
    return {};
  };

  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      style={{ height: 600 }}
      eventPropGetter={eventStyleGetter}
      dayPropGetter={dayPropGetter}
      popup={true} // da prikazuje sve evente ako ih je vise
    />
  );
}