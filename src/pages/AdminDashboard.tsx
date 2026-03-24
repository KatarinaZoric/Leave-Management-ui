/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import type { Event as BigCalendarEvent } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { api } from '../services/api';
import logoImg from '../assets/archive_default_photo.jpg'; // ubaci svoj logo

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

export default function AdminDashboard() {
  const [events, setEvents] = useState<LeaveEventResponse[]>([]);
  const [adminName, setAdminName] = useState<string>(''); // Dinamično ime admina

  // Dohvati ime admina iz JWT tokena
  useEffect(() => {
  const token = localStorage.getItem('token');
  console.log('JWT token:', token); // ovo će ti pokazati da li postoji
  if (!token) return;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('JWT payload:', payload); // da vidiš name i surname
    const fullName = [payload.name, payload.surname].filter(Boolean).join(' ');
    setAdminName(fullName || 'Administrator');
  } catch (err) {
    console.error('Greška pri parsiranju tokena:', err);
    setAdminName('Administrator');
  }
}, []);

  // Fetch events (budući)
  const fetchEvents = async () => {
    try {
      const data: LeaveEventResponse[] = await api.getLeaveEvents();
      const today = new Date();
      const futureEvents = data.filter((e: LeaveEventResponse) => new Date(e.endDate) >= today);
      setEvents(futureEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
  try {
    const data: LeaveEventResponse[] = await api.getLeaveEvents();
    if (isMounted) {
      const today = new Date();
      // e je sada tipizovan
      const futureEvents = data.filter((e: LeaveEventResponse) => new Date(e.endDate) >= today);
      setEvents(futureEvents);
    }
  } catch (err) {
    console.error('Error fetching events:', err);
  }
};
    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const approve = async (id: string) => {
    try {
      await api.approveLeave(id);
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const reject = async (id: string) => {
    try {
      await api.rejectLeave(id);
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const pendingEvents = events.filter((e) => e.status === 'PENDING');

  // Formatiramo za kalendar
  const calendarEvents: BigCalendarEvent[] = events.map((e) => ({
    id: e.id,
    title: `${e.user.name} ${e.user.surname} - ${e.leaveType.name}`,
    start: new Date(e.startDate),
    end: new Date(e.endDate),
    color: e.leaveType.color,
  }));

  const eventStyleGetter = (event: BigCalendarEvent) => ({
    style: {
      backgroundColor: (event as any).color || '#6fa8dc',
      color: '#000',
      borderRadius: '5px',
      border: '1px solid #ccc',
      padding: '2px',
      fontSize: '0.85rem',
      whiteSpace: 'normal',
    },
  });

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif', backgroundColor: '#f0f4f8', minHeight: '100vh' }}>
      {/* Zaglavlje */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#d9e8fb',
          padding: 20,
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
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
            style={{ height: 600 }}
            eventPropGetter={eventStyleGetter}
            views={['month']}
            popup={false} // svi događaji se prikazuju
            components={{
              event: ({ event }) => <div>{(event as any).title}</div>,
            }}
          />
        </div>

        {/* Lista pending odsustava */}
        <div style={{ flex: 1, maxHeight: 600, overflowY: 'auto', backgroundColor: '#e6ebf2', padding: 15, borderRadius: 10 }}>
          <h3 style={{ textAlign: 'center' }}>Zahtevi za odsustvo</h3>
          {pendingEvents.length === 0 && <p>Nema zahteva na čekanju.</p>}
          {pendingEvents.map((e) => (
            <div
              key={e.id}
              style={{
                border: '1px solid #ccc',
                borderRadius: 8,
                padding: 10,
                marginBottom: 10,
                backgroundColor: '#fff',
              }}
            >
              <strong>{e.user.name} {e.user.surname} - {e.leaveType.name}</strong>
              <p>{new Date(e.startDate).toLocaleDateString()} → {new Date(e.endDate).toLocaleDateString()}</p>
              {e.note && <p>Napomena: {e.note}</p>}
              <div style={{ marginTop: 5 }}>
                <button onClick={() => approve(e.id)} style={{ marginRight: 5, padding: 5 }}>Approve</button>
                <button onClick={() => reject(e.id)} style={{ padding: 5 }}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}