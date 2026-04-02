/* eslint-disable @typescript-eslint/no-explicit-any */
import { Calendar, momentLocalizer } from 'react-big-calendar';
import type { Event as BigCalendarEvent, SlotInfo } from 'react-big-calendar';
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
  id?: string;
};

interface CalendarViewProps {
  events?: LeaveEventResponse[];
}

export default function CalendarView({ events: initialEvents }: CalendarViewProps) {
  const [events, setEvents] = useState<EventType[]>([]);
  const [selectedDateEvents, setSelectedDateEvents] = useState<EventType[] | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data: LeaveEventResponse[] = initialEvents || await api.getLeaveEvents();
        const formatted: EventType[] = data.map(e => ({
          id: e.id,
          title: `${e.user?.name || 'Nepoznato'} - ${e.leaveType?.name || ''}`,
          start: e.startDate ? new Date(e.startDate) : undefined,
          end: e.endDate ? new Date(e.endDate) : undefined,
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
      cursor: 'pointer',
      whiteSpace: 'normal',
      fontSize: '0.85rem',
    },
  });

  const dayPropGetter = (date: Date) => {
    const today = new Date();
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (d < t) {
      return { style: { backgroundColor: '#f0f0f0', color: '#999' } };
    }
    return {};
  };

  const CustomToolbar = ({ date, onNavigate }: any) => {
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <button onClick={() => onNavigate('PREV')} style={{ fontSize: 18 }}>◀</button>
        <span style={{ fontWeight: 'bold' }}>{month} {year}</span>
        <button onClick={() => onNavigate('NEXT')} style={{ fontSize: 18 }}>▶</button>
      </div>
    );
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const start = new Date(slotInfo.start);
    const end = new Date(slotInfo.end);

    const dayEvents = events.filter(e => e.start && e.end && e.start <= end && e.end >= start);
    setSelectedDateEvents(dayEvents);
  };

  const EventComponent = ({ event }: { event: EventType }) => (
    <div onClick={() => setSelectedDateEvents([event])}>{event.title}</div>
  );

  return (
    <div>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        eventPropGetter={eventStyleGetter}
        dayPropGetter={dayPropGetter}
        views={['month']}
        selectable
        onSelectSlot={handleSelectSlot}
        popup={false} // uklanja +n more
        components={{ toolbar: CustomToolbar, event: EventComponent }}
      />

      {selectedDateEvents && selectedDateEvents.length > 0 && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000
          }}
          onClick={() => setSelectedDateEvents(null)}
        >
          <div
            style={{ backgroundColor: '#fff', padding: 20, borderRadius: 10, minWidth: 300, maxWidth: 500 }}
            onClick={e => e.stopPropagation()}
          >
            <h3>Odsustva dana</h3>
            {selectedDateEvents.map(e => (
              <div key={e.id} style={{ marginBottom: 10, borderBottom: '1px solid #ccc', paddingBottom: 5 }}>
                <strong>{e.userName || 'Nepoznato'}</strong>
                <p>Tip: {String(e.title).split(' - ')[1] || '-'}</p>
                <p>Od: {e.start ? e.start.toLocaleDateString() : '-'}</p>
                <p>Do: {e.end ? e.end.toLocaleDateString() : '-'}</p>
                {e.note && <p>Napomena: {e.note}</p>}
              </div>
            ))}
            <button onClick={() => setSelectedDateEvents(null)} style={{ marginTop: 10, padding: 5 }}>Zatvori</button>
          </div>
        </div>
      )}
    </div>
  );
}