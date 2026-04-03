/* eslint-disable no-empty */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import type { SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { api } from '../services/api';
import logoImg from '../assets/archive_default_photo.jpg';
import { useNavigate } from 'react-router-dom';

moment.locale('sr');
const localizer = momentLocalizer(moment);

/* ================= TYPES ================= */

type User = {
  id: string;
  name: string;
  surname: string;
  email: string;
};

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

/* ================= COMPONENT ================= */

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [events, setEvents] = useState<LeaveEventResponse[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedDateEvents, setSelectedDateEvents] =
    useState<CalendarEvent[] | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [adminName, setAdminName] = useState('Administrator');

  /* === USERS === */
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');

  /* ================= ADMIN NAME ================= */

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setAdminName(
        [payload.name, payload.surname].filter(Boolean).join(' ')
      );
    } catch {}
  }, []);

  /* ================= FETCH EVENTS ================= */

  const fetchEvents = async () => {
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
  };

  /* ================= FETCH USERS ================= */

  const fetchUsers = async () => {
    const data = await api.getUsers();
    setUsers(data);
  };

  useEffect(() => {
    fetchEvents();
    fetchUsers();
  }, []);

  /* ================= ACTIONS ================= */

  const approve = async (id: string) => {
    await api.approveLeave(id);
    fetchEvents();
  };

  const reject = async (id: string) => {
    await api.rejectLeave(id);
    fetchEvents();
  };

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const pendingEvents = events.filter(e => e.status === 'PENDING');

  /* ================= CALENDAR STYLES ================= */

  const eventStyleGetter = (event: CalendarEvent) => ({
    style: {
      backgroundColor: event.color || '#6fa8dc',
      color: '#000',
      borderRadius: 5,
    },
  });

  const dayPropGetter = (date: Date) => {
    const today = new Date();
    if (date < today)
      return {
        style: {
          backgroundColor: '#f3f3f3',
          pointerEvents: 'none',
        },
      };
    return { style: {} };
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const start = new Date(slotInfo.start);
    const end = new Date(slotInfo.end);

    const dayEvents = calendarEvents.filter(
      e => e.start <= end && e.end >= start
    );

    setSelectedDateEvents(dayEvents);
  };

  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <div onClick={() => setSelectedDateEvents([event])}>
      {event.title}
    </div>
  );

  const CustomToolbar = ({ date, onNavigate }: any) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}
    >
      <button onClick={() => onNavigate('PREV')}>◀</button>
      <strong>
        {date.toLocaleString('default', { month: 'long' })}{' '}
        {date.getFullYear()}
      </strong>
      <button onClick={() => onNavigate('NEXT')}>▶</button>
    </div>
  );

  /* ================= UI ================= */

  return (
    <div
      style={{
        padding: 20,
        background: '#f0f4f8',
        minHeight: '100vh',
        fontFamily: 'Arial',
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          background: '#d9e8fb',
          padding: 20,
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', gap: 20 }}>
          <img src={logoImg} width={150} />
          <div>
            <h2>{adminName}</h2>
            <p>Administrativni pregled odsustava</p>
          </div>
        </div>

        <button onClick={logout}>Logout</button>
      </div>

      {/* ===== ENTERPRISE GRID ===== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '3fr 1fr',
          gridTemplateRows: '600px auto',
          gap: 20,
        }}
      >
        {/* CALENDAR */}
        <div
          style={{
            background: '#fff',
            padding: 15,
            borderRadius: 10,
            height: 600,
            overflowY: 'auto',
          }}
        >
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            date={currentDate}
            onNavigate={setCurrentDate}
            style={{ height: 600 }}
            eventPropGetter={eventStyleGetter}
            dayPropGetter={dayPropGetter}
            views={['month']}
            selectable
            onSelectSlot={handleSelectSlot}
            components={{
              toolbar: CustomToolbar,
              event: EventComponent,
            }}
          />
        </div>

        {/* REQUESTS */}
        <div
          style={{
            background: '#e6ebf2',
            padding: 15,
            borderRadius: 10,
            maxHeight: 600,
            overflowY: 'auto',
          }}
        >
          <h3>Zahtevi za odsustvo</h3>

          {pendingEvents.length === 0 && <p>Nema zahteva.</p>}

          {pendingEvents.map(e => (
            <div
              key={e.id}
              style={{
                background: '#fff',
                padding: 10,
                borderRadius: 8,
                marginBottom: 10,
              }}
            >
              <strong>
                {e.user.name} {e.user.surname}
              </strong>

              <p>
                {new Date(e.startDate).toLocaleDateString()} →
                {new Date(e.endDate).toLocaleDateString()}
              </p>

              <button onClick={() => approve(e.id)}>Odobri</button>
              <button onClick={() => reject(e.id)}>Odbij</button>
            </div>
          ))}
        </div>

        {/* USERS LIST BELOW */}
        <div
          style={{
            gridColumn: '1 / span 2',
            background: '#fff',
            padding: 20,
            borderRadius: 10,
          }}
        >
          <h3>Lista korisnika</h3>

          <input
            placeholder="Pretraži korisnika..."
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: 10,
              marginBottom: 15,
              borderRadius: 8,
              border: '1px solid #ccc',
            }}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(240px,1fr))',
              gap: 15,
            }}
          >
            {users
              .filter(u =>
                `${u.name} ${u.surname}`
                  .toLowerCase()
                  .includes(search.toLowerCase())
              )
              .map(user => (
                <div
                  key={user.id}
                  onClick={() =>
                    navigate(`/admin/user/${user.id}`)
                  }
                  style={{
                    padding: 15,
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: '#f7faff',
                    border: '1px solid #dde6f2',
                  }}
                >
                  <strong>
                    {user.name} {user.surname}
                  </strong>
                  <p>{user.email}</p>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {selectedDateEvents && (
        <div
          onClick={() => setSelectedDateEvents(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              padding: 20,
              borderRadius: 10,
            }}
          >
            <h3>Odsustva dana</h3>

            {selectedDateEvents.map(e => (
              <div key={e.id}>
                <strong>{e.userName}</strong>
                <p>
                  {e.start.toLocaleDateString()} →
                  {e.end.toLocaleDateString()}
                </p>
              </div>
            ))}

            <button
              onClick={() => setSelectedDateEvents(null)}
            >
              Zatvori
            </button>
          </div>
        </div>
      )}
    </div>
  );
}