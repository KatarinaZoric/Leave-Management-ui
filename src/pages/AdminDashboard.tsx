/* eslint-disable no-empty */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import type { SlotInfo } from 'react-big-calendar';import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { api } from '../services/api';
import logoImg from '../assets/archive_default_photo.jpg';

moment.locale('sr');
const localizer = momentLocalizer(moment);

type LeaveEventResponse = {
  id: string;
  user: { name: string; surname: string; email: string };
  leaveType: { name: string; color?: string };
  startDate: string;
  endDate: string;
  status: string;
  note?: string;
};

type CalendarEvent = {
  id?: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  userName?: string;
  note?: string;
};

export default function AdminDashboard() {
  // STATE
  const [events, setEvents] = useState<LeaveEventResponse[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedDateEvents, setSelectedDateEvents] = useState<CalendarEvent[] | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date()); // za toolbar
  const [adminName, setAdminName] = useState<string>('Administrator');

  // Dohvati ime admina iz JWT tokena
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setAdminName([payload.name, payload.surname].filter(Boolean).join(' ') || 'Administrator');
    } catch {}
  }, []);

  // Fetch events i format za kalendar
  const fetchEvents = async () => {
    try {
      const data: LeaveEventResponse[] = await api.getLeaveEvents();
      setEvents(data);

      const formatted: CalendarEvent[] = data.map(e => ({
        id: e.id,
        title: `${e.user.name} ${e.user.surname} - ${e.leaveType.name}`,
        start: new Date(e.startDate),
        end: new Date(e.endDate),
        color: e.leaveType.color,
        userName: e.user.name + ' ' + e.user.surname,
        note: e.note,
      }));
      setCalendarEvents(formatted);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Approve / Reject / Logout
  const approve = async (id: string) => { await api.approveLeave(id); fetchEvents(); };
  const reject = async (id: string) => { await api.rejectLeave(id); fetchEvents(); };
  const logout = () => { localStorage.removeItem('token'); window.location.href = '/'; };

  const pendingEvents = events.filter(e => e.status === 'PENDING');

  // Stil za događaje
  const eventStyleGetter = (event: CalendarEvent) => ({
    style: {
      backgroundColor: event.color || '#6fa8dc',
      color: '#000',
      borderRadius: '5px',
      border: '1px solid #ccc',
      padding: '2px',
      fontSize: '0.85rem',
      whiteSpace: 'normal',
    },
  });

  // Sivi prošli dani
  const dayPropGetter = (date: Date): { style: React.CSSProperties } => {
    const today = new Date();
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (d < t) {
      return { style: { backgroundColor: '#f0f0f0', color: '#999', pointerEvents: 'none' } };
    }
    return { style: {} };
  };

  // Custom Toolbar
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

  // Klik na slot / dan
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const start = new Date(slotInfo.start);
    const end = new Date(slotInfo.end);
    const dayEvents = calendarEvents.filter(e => e.start <= end && e.end >= start);
    setSelectedDateEvents(dayEvents);
  };

  // Klik na event
  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <div onClick={() => setSelectedDateEvents([event])}>{event.title}</div>
  );

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif', backgroundColor: '#f0f4f8', minHeight: '100vh' }}>
      {/* Zaglavlje */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#d9e8fb', padding: 20, borderRadius: 10, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <img src={logoImg} alt="Logo" style={{ width: 150, height: 'auto' }} />
          <div>
            <h2 style={{ margin: 0 }}>{adminName}</h2>
            <p style={{ margin: 0, color: '#555' }}>Administrativni pregled odsustava</p>
          </div>
        </div>
        <button onClick={logout} style={{ padding: 10 }}>Logout</button>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Kalendar */}
        <div style={{ flex: 3, backgroundColor: '#fff', padding: 15, borderRadius: 10, boxShadow: '0 0 10px rgba(0,0,0,0.05)' }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            date={currentDate}                    // 👈 trenutni mesec
            onNavigate={(date) => setCurrentDate(date)} // 👈 update meseca
            style={{ height: 600 }}
            eventPropGetter={eventStyleGetter}
            dayPropGetter={dayPropGetter}
            views={['month']}
            selectable
            onSelectSlot={handleSelectSlot}
            popup={false}
            components={{ toolbar: CustomToolbar, event: EventComponent }}
          />
        </div>

        {/* Lista pending odsustava */}
        <div style={{ flex: 1, maxHeight: 600, overflowY: 'auto', backgroundColor: '#e6ebf2', padding: 15, borderRadius: 10 }}>
          <h3 style={{ textAlign: 'center' }}>Zahtevi za odsustvo</h3>
          {pendingEvents.length === 0 && <p>Nema zahteva na čekanju.</p>}
          {pendingEvents.map((e) => (
            <div key={e.id} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: '#fff' }}>
              <strong>{e.user.name} {e.user.surname} - {e.leaveType.name}</strong>
              <p>{new Date(e.startDate).toLocaleDateString()} → {new Date(e.endDate).toLocaleDateString()}</p>
              {e.note && <p>Napomena: {e.note}</p>}
              <div style={{ marginTop: 5 }}>
                <button onClick={() => approve(e.id)} style={{ marginRight: 5, padding: 5 }}>Odobri</button>
                <button onClick={() => reject(e.id)} style={{ padding: 5 }}>Odbij</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal za selektovane događaje */}
      {selectedDateEvents && selectedDateEvents.length > 0 && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000
          }}
          onClick={() => setSelectedDateEvents(null)}
        >
          <div style={{ backgroundColor: '#fff', padding: 20, borderRadius: 10, minWidth: 300, maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <h3>Odsustva dana</h3>
            {selectedDateEvents.map(e => (
              <div key={e.id} style={{ marginBottom: 10, borderBottom: '1px solid #ccc', paddingBottom: 5 }}>
                <strong>{e.userName}</strong>
                <p>Tip: {String(e.title).split(' - ')[1] || '-'}</p>
                <p>Od: {e.start.toLocaleDateString()}</p>
                <p>Do: {e.end.toLocaleDateString()}</p>
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