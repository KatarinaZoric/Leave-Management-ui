/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
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

moment.locale('sr');
const localizer = momentLocalizer(moment);

/* ================= TYPES ================= */

type User = {
  id: string;
  name: string;
  surname: string;
  email: string;
  remainingDays: Record<string, number>; // { 2025: 5, 2026: 12 }
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
  //const navigate = useNavigate();

  const [events, setEvents] = useState<LeaveEventResponse[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedDateEvents, setSelectedDateEvents] =
    useState<CalendarEvent[] | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userName, setUserName] = useState('Korisnik');
  const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'EMPLOYEE'>('EMPLOYEE');

  /* === USERS === */
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');

  /* === BALANCE MODAL === */
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceUserId, setBalanceUserId] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState<number>(0);
  const [balanceYear, setBalanceYear] = useState<number>(new Date().getFullYear());

  /* === REJECT MODAL === */
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectLeaveId, setRejectLeaveId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [validUntilDate, setValidUntilDate] = useState<string>('');

  /* === MONTHLY VIEW STATE === */
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const currentYear = new Date().getFullYear();
  const daysInMonth = (month: number, year: number) =>
    new Date(year, month + 1, 0).getDate();

  /* ================= USER INFO ================= */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserName([payload.name, payload.surname].filter(Boolean).join(' '));
      setRole(payload.role || 'EMPLOYEE'); 
    } catch {}
  }, []);

  /* ================= WORKDAY EVENT SPLIT ================= */

const isWeekend = (date: Date) => {
  const d = date.getDay();
  return d === 0 || d === 6;
};

const splitEventByWorkdays = (event: CalendarEvent): CalendarEvent[] => {
  const result: CalendarEvent[] = [];

  let current = new Date(event.start);
  const end = new Date(event.end);

  current.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  let rangeStart: Date | null = null;

  while (current <= end) {
    const weekend = isWeekend(current);

    if (!weekend && !rangeStart) {
      rangeStart = new Date(current);
    }

    if ((weekend || current.getTime() === end.getTime()) && rangeStart) {
      const rangeEnd = weekend
        ? new Date(current.getTime() - 86400000)
        : new Date(current);

      const start = new Date(rangeStart);
      start.setHours(8, 0, 0);

      const finish = new Date(rangeEnd);
      finish.setHours(16, 0, 0);

      result.push({
        ...event,
        start,
        end: finish,
      });

      rangeStart = null;
    }

    current.setDate(current.getDate() + 1);
  }

  return result;
};
const fetchEvents = async () => {
  const data: LeaveEventResponse[] = await api.getLeaveEvents();

  const filteredData = data.filter(e => e.status !== 'CANCELLED');

  const formatted: CalendarEvent[] = filteredData.flatMap(e =>
    splitEventByWorkdays({
      id: e.id,
      title: `${e.user.name} ${e.user.surname} - ${e.leaveType.name}`,
      start: new Date(e.startDate),
      end: new Date(e.endDate),
      color: e.leaveType.color,
      userName: e.user.name + ' ' + e.user.surname,
      note: e.note,
    })
  );

  setEvents(filteredData);
  setCalendarEvents(formatted);
};

  /* ================= FETCH USERS ================= */
  const fetchUsers = async () => {
  const data: User[] = await api.getUsersWithBalances(); 
  setUsers(data);
};

  useEffect(() => {
    if (balanceYear) {
      const nextYear = balanceYear + 1;
      const dateStr = `${nextYear}-06-01`;
      setValidUntilDate(dateStr);
    }
  }, [balanceYear]);

  useEffect(() => {
    fetchEvents();
    fetchUsers();
  }, []);

  /* ================= ACTIONS ================= */
  const approve = async (id: string) => {
    await api.approveLeave(id);
    fetchEvents();
  };

  const openRejectModal = (id: string) => {
    setRejectLeaveId(id);
    setRejectModalOpen(true);
  };

  const rejectWithReason = async () => {
    if (!rejectLeaveId) return;
    await api.rejectLeave(rejectLeaveId, rejectReason);
    alert('Razlog odbijanja je poslat korisniku!');
    fetchEvents();
    setRejectModalOpen(false);
    setRejectReason('');
  };

  const addBalance = async () => {
    if (!balanceUserId || newBalance <= 0) {
      alert('Unesite broj dana za balans');
      return;
    }

    try {
      await api.updateUserBalance(balanceUserId, newBalance, balanceYear);
      await fetchUsers(); 
      setBalanceModalOpen(false);
      setNewBalance(0);
      setBalanceYear(new Date().getFullYear());
      setBalanceUserId(null);
      alert('Balans uspešno dodat!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Greška prilikom dodavanja balansa.');
    }
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
  const day = date.getDay();

  const isWeekend = day === 0 || day === 6;

  if (isWeekend) {
    return {
      style: {
        backgroundColor: '#7796f4',
      },
    };
  }

  return { style: {} };
};

  const handleSelectSlot = (slotInfo: SlotInfo) => {
  const clickedDate = new Date(slotInfo.start);
  clickedDate.setHours(0, 0, 0, 0);

  const dayEvents = calendarEvents.filter(event => {
    const start = new Date(event.start);
    const end = new Date(event.end);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    return clickedDate >= start && clickedDate <= end;
  });

  setSelectedDateEvents(dayEvents);
};

  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <div onClick={() => setSelectedDateEvents([event])}>{event.title}</div>
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
        background: '#0077cc',
        minHeight: '100vh',
        fontFamily: 'Arial',
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          background: "#d9e8fb",
          padding: 20,
          borderRadius: 10,
          marginBottom: 20,
          minHeight: 120,
        }}
      >
        <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
          <img src={logoImg} width={200} style={{ borderRadius: 5 }} />
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h2 style={{ margin: 0 }}>Evidencija odsustava</h2>
            <p style={{ margin: 0 }}>{userName}</p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <button
            onClick={logout}
            style={{
              backgroundColor: "#0d5fb0",
              color: "#fff",
              padding: "10px 20px",
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
            }}
          >
            Odjavi se
          </button>
        </div>
      </div>

      {/* ENTERPRISE GRID */}
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
            key={calendarEvents.length}
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
            components={{ toolbar: CustomToolbar, event: EventComponent }}
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
          {pendingEvents.length === 0 && <p>Trenutno nema novih zahteva.</p>}
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
              <strong>{e.user.name} {e.user.surname}</strong>
              <p><strong>{e.leaveType.name}</strong></p>
              {e.note && <p><strong>Napomena:</strong> {e.note}</p>}
              <p>{new Date(e.startDate).toLocaleDateString()} → {new Date(e.endDate).toLocaleDateString()}</p>
              {role === 'ADMIN' && (
                <>
                  <button onClick={() => approve(e.id)}>Odobri</button>
                  <button onClick={() => openRejectModal(e.id)}>Odbij</button>
                </>
              )}
            </div>
          ))}
        </div>

       {/* USERS LIST */}
<div
  style={{
    gridColumn: '1 / span 2',
    background: '#fff',
    padding: 20,
    borderRadius: 10,
    border: '2px solid #a0b4e0',
    backgroundColor: '#e6ebf2',
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
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))',
      gap: 15,
    }}
  >
    {users
      .filter(u =>
        `${u.name} ${u.surname}`.toLowerCase().includes(search.toLowerCase())
      )
      .map(user => (
        <div
          key={user.id}
          style={{
            padding: 15,
            borderRadius: 10,
            cursor: 'pointer',
            background: '#f7faff',
            border: '1px solid #dde6f2',
          }}
        >
          <strong>{user.name} {user.surname}</strong>
          <p>{user.email}</p>

          {/* Pregled preostalih dana sa progresom */}
          {/* Pregled preostalih dana sa progresom */}
{user.remainingDays && typeof user.remainingDays === 'object' ? (
  <div style={{ marginTop: 10 }}>
    <strong>Preostali dani</strong>
    {Object.entries(user.remainingDays).map(([year, remaining]) => {
      const total = 20; 
      const remainingDays = Number(remaining);
      const used = total - remainingDays;
      const percent = (used / total) * 100;

      return (
        <div key={year} style={{ marginBottom: 8 }}>
          <span>
            {year}: {remainingDays} dana
          </span>
          <div
            style={{
              height: 10,
              background: "#ddd",
              borderRadius: 5,
              marginTop: 4,
            }}
          >
            <div
              style={{
                width: `${percent}%`,
                background: "#6edd6a",
                height: "100%",
                borderRadius: 5,
              }}
            />
          </div>
        </div>
      );
    })}
  </div>
) : (
  <p>Nema podataka o preostalim danima</p>
)}

          <div style={{ marginTop: 10 }}>
            <button
              onClick={() => {
                setBalanceUserId(user.id);
                setBalanceModalOpen(true);
              }}
            >
              Dodaj balans
            </button>
          </div>
        </div>
      ))}
  </div>
</div>

{/* Ostatak koda za mesečni pregled, modale i ostalo ostaje identično */}
        {/* MONTHLY VIEW */}
        <div
          style={{
            gridColumn: '1 / span 2',
            background: '#fff',
            padding: 20,
            borderRadius: 10,
            border: '2px solid #a0b4e0',
            marginTop: 20,
          }}
        >
          <h3>Mesečni pregled odsustava</h3>

          {/* Lista meseci */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 15 }}>
            {Array.from({ length: 12 }, (_, i) => i).map(monthIndex => {
              const monthName = new Date(0, monthIndex).toLocaleString('sr-Latn', { month: 'long' });
              return (
                <button
                  key={monthIndex}
                  onClick={() => setSelectedMonth(monthIndex)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 5,
                    border: '1px solid #ccc',
                    backgroundColor: selectedMonth === monthIndex ? '#0077cc' : '#f3f3f3',
                    color: selectedMonth === monthIndex ? '#fff' : '#000',
                    cursor: 'pointer',
                  }}
                >
                  {monthName}
                </button>
              );
            })}
          </div>

      {/* Prikaz tabele */}
{/* Prikaz tabele */}
{selectedMonth !== null && (
  <div style={{ overflowX: 'auto', maxHeight: 400 }}>
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th style={{ border: '1px solid #ccc', padding: 5, background: '#e6ebf2' }}>
            Korisnik
          </th>

          {Array.from(
            { length: daysInMonth(selectedMonth, currentYear) },
            (_, i) => (
              <th
                key={i}
                style={{
                  border: '1px solid #ccc',
                  padding: 5,
                  width: 25,
                  textAlign: 'center',
                  background: '#f3f3f3',
                }}
              >
                {i + 1}
              </th>
            )
          )}
        </tr>
      </thead>

      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td style={{ border: '1px solid #ccc', padding: 5 }}>
              {user.name} {user.surname}
            </td>

            {Array.from(
              { length: daysInMonth(selectedMonth, currentYear) },
              (_, dayIndex) => {
                const dayDate = new Date(
                  currentYear,
                  selectedMonth,
                  dayIndex + 1
                );

                const dayOfWeek = dayDate.getDay();

                /* === VIKEND === */
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                  return (
                    <td
                      key={dayIndex}
                      style={{
                        border: '1px solid #ccc',
                        width: 25,
                        height: 25,
                        backgroundColor: '#ccc',
                      }}
                    />
                  );
                }

                /* === PROVERA DATUMA === */
                const isSameDayOrBetween = (
                  start: Date,
                  end: Date,
                  day: Date
                ) => {
                  const s = new Date(start);
                  const e = new Date(end);
                  const d = new Date(day);

                  s.setHours(0, 0, 0, 0);
                  e.setHours(0, 0, 0, 0);
                  d.setHours(0, 0, 0, 0);

                  return s <= d && d <= e;
                };

                /* === PRONALAZI ODSUSTVO === */
                const absenceEvent = events
  .filter(e => e.status !== 'CANCELLED')
  .find(
                  e =>
                    e.user.name === user.name &&
                    e.user.surname === user.surname &&
                    isSameDayOrBetween(
                      new Date(e.startDate),
                      new Date(e.endDate),
                      dayDate
                    )
                );

                const leaveType =
                  absenceEvent?.leaveType?.name?.toLowerCase();

                /* === BOJE === */
                let backgroundColor = '#fff';

                if (leaveType) {
                  if (leaveType.includes('bol')) {
                    backgroundColor = '#e91414'; // 🟡 bolovanje
                  } else if (
                    leaveType.includes('godi') ||
                    leaveType.includes('slobod')
                  ) {
                    backgroundColor = '#3b78d2'; // 🔴 godišnji/slobodan
                  }
                }

                return (
                  <td
                    key={dayIndex}
                    title={absenceEvent?.leaveType?.name || ''}
                    style={{
                      border: '1px solid #ccc',
                      width: 25,
                      height: 25,
                      backgroundColor,
                      cursor: absenceEvent ? 'pointer' : 'default',
                    }}
                  />
                );
              }
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

  </div>
    </div>
      {/* MODALS: selectedDateEvents, balanceModalOpen, rejectModalOpen */}
      {/* Selected Date Events */}
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
  zIndex: 999999, 
}}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', padding: 20, borderRadius: 10 }}
          >
            <h3>Odsustva dana</h3>
            {selectedDateEvents.map(e => (
              <div key={e.id}>
                <strong>{e.userName}</strong>
                <p>{e.start.toLocaleDateString()} → {e.end.toLocaleDateString()}</p>
              </div>
            ))}
            <button onClick={() => setSelectedDateEvents(null)} style={{ marginTop: 10 }}>
              Zatvori
            </button>
          </div>
        </div>
      )}

      {/* BALANCE MODAL */}
      {balanceModalOpen && (
        <div
          onClick={() => setBalanceModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              padding: 20,
              borderRadius: 10,
              width: 350,
              maxWidth: '90%',
              zIndex: 10000,
            }}
          >
            <h3>Unesi novi balans dana</h3>
            <input
              type="number"
              value={newBalance}
              onChange={e => setNewBalance(parseInt(e.target.value))}
              placeholder="Broj dana"
              style={{ marginBottom: 10, width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
            />
            <input
              type="number"
              value={balanceYear}
              onChange={e => setBalanceYear(parseInt(e.target.value))}
              placeholder="Godina"
              style={{ marginBottom: 10, width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
            />
            <div style={{ marginBottom: 10 }}>
              <label>Validno do:</label>
              <input
                type="text"
                value={validUntilDate}
                readOnly
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', backgroundColor: '#f3f3f3' }}
              />
            </div>
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={addBalance}>Sačuvaj</button>
              <button onClick={() => setBalanceModalOpen(false)} style={{ marginLeft: 5 }}>
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalOpen && (
        <div
          onClick={() => setRejectModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              padding: 20,
              borderRadius: 10,
              width: 400,
              maxWidth: '90%',
              zIndex: 10000,
            }}
          >
            <h3>Unesi razlog odbijanja odsustva</h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={4}
              style={{ width: '100%' }}
            />
            <div style={{ marginTop: 10 }}>
              <button onClick={rejectWithReason}>Potvrdi</button>
              <button
                onClick={() => setRejectModalOpen(false)}
                style={{ marginLeft: 5 }}
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}