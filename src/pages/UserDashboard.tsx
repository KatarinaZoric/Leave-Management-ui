/* eslint-disable prefer-const */
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";
import logo from "../assets/archive_default_photo.jpg";

// TIPOVI
type LeaveType = {
  id: string;
  name: string;
};

type LeaveEvent = {
  id: string;
  user: { id: string };
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  status: string;
  note?: string;
};

type LeaveBalance = {
  year: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
};

export default function UserDashboard() {
  const navigate = useNavigate();

  const [events, setEvents] = useState<LeaveEvent[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("ALL");
  const [requestedDays, setRequestedDays] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  const [newEvent, setNewEvent] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    note: "",
  });

  const [balances, setBalances] = useState<LeaveBalance[]>([]);


  // 🎨 COLORS
  const colors = {
    primary: "#1e3a8a",
    secondary: "#3b82f6",
  };

  const inputStyle = {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    border: "1px solid #cbd5f5",
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // ================= HELPERS =================
  const countWorkingDays = (start: Date, end: Date) => {
    let count = 0;
    let current = new Date(start);

    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const hasWorkingDays = (start: Date, end: Date) => {
    let current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) return true;
      current.setDate(current.getDate() + 1);
    }
    return false;
  };

  // ================= FETCH =================
  const fetchData = async () => {
    try {
      setLoading(true);

      const [eventsData, typesData] = await Promise.all([
        api.getLeaveEvents(),
        api.getLeaveTypes(),
      ]);

      const token = localStorage.getItem("token");
      let userId = "";

      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        userId = payload.sub || payload.id;

        const fullName =
          payload.firstName && payload.surname
            ? `${payload.firstName} ${payload.surname}`
            : payload.name || payload.username || payload.email || "User";

        setUserName(fullName);

        // fetch leave balances sa nove rute
        const balanceData: LeaveBalance[] = await api.getMyAllBalances();
        setBalances(balanceData);
      }

      // filtriranje samo mojih odsustava
      const userEvents = eventsData.filter(
        (e: LeaveEvent) => e.user.id === userId
      );

      setEvents(userEvents);
      setLeaveTypes(typesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= LIVE DAYS =================
  useEffect(() => {
    if (newEvent.startDate && newEvent.endDate) {
      const start = new Date(newEvent.startDate);
      const end = new Date(newEvent.endDate);
      setRequestedDays(countWorkingDays(start, end));
    } else {
      setRequestedDays(0);
    }
  }, [newEvent.startDate, newEvent.endDate]);

  // ================= SUBMIT =================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const start = new Date(newEvent.startDate);
    const end = new Date(newEvent.endDate);

    if (start > end) return alert("Pogrešan opseg datuma.");
    if (isPastDate(start) || isPastDate(end))
      return alert("Ne može za prošlost.");
    if (!hasWorkingDays(start, end))
      return alert("Mora sadržati radne dane.");

     const overlap = events.some((existing) => {
    if (existing.status !== "APPROVED") return false; // proveravamo samo odobrena
    const existingStart = new Date(existing.startDate);
    const existingEnd = new Date(existing.endDate);
    return start <= existingEnd && end >= existingStart;
  });

  if (overlap) return alert("Već imate odsustvo u ovom periodu.");

    const currentBalance = balances.find(
      (b) => b.year === new Date().getFullYear()
    );
    if (currentBalance && requestedDays > currentBalance.remainingDays)
      return alert("Nemaš dovoljno preostalih dana.");

    try {
      await api.createLeaveEvent(newEvent);

      setSuccessMessage(
        "Zahtev poslat. Odgovor očekujte u najkraćem roku."
      );
      setTimeout(() => setSuccessMessage(""), 10000);

      setNewEvent({
        leaveTypeId: "",
        startDate: "",
        endDate: "",
        note: "",
      });

      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Učitavanje...</p>;

  const filteredEvents =
    filter === "ALL"
      ? events
      : events.filter((e) => e.status === filter);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 20,
        background: "linear-gradient(135deg, #dbeafe, #f1f5f9)",
      }}
    >
      {/* HEADER */}
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  }}
>
  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
    <img
      src={logo}
      style={{
        width: 200,
        height: 200,
        objectFit: "contain",
        borderRadius: 8,
      }}
    />
    <strong style={{ fontSize: 26 }}>
      {userName} , dobrodošli u CPSU evidenciju odsustava
    </strong>
  </div>

  <button
    onClick={logout}
    style={{
      background: colors.primary,
      color: "white",
      border: "none",
      padding: "6px 12px",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 14,
    }}
  >
    Logout
  </button>
</div>

      {/* MODAL */}
      {successMessage && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "#dbeafe",
            padding: 15,
            borderRadius: 10,
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            zIndex: 1000,
            animation: "fadein 0.3s, fadeout 0.3s 3.7s",
          }}
        >
          {successMessage}
        </div>
      )}

      {/* LEAVE BALANCE */}
      <div style={{ marginBottom: 20 }}>
        <h3>Preostali dani godišnjeg</h3>
        {balances.length === 0 && <p>Nema podataka o balansima.</p>}
        {balances.map((b) => {
          const total = Number(b.totalDays) || 0;
          const used = Number(b.usedDays) || 0;
          const remaining = Number(b.remainingDays) || total - used;

          const percent = total > 0 ? (used / total) * 100 : 0;

          return (
            <div key={b.year} style={{ marginBottom: 12 }}>
              <strong>
                Godina {b.year} - Iskorišćeno: {used} / {total}, Preostalo: {remaining}
              </strong>
              <div
                style={{
                  height: 12,
                  background: "#ddd",
                  borderRadius: 6,
                  marginTop: 4,
                }}
              >
                <div
                  style={{
                    width: `${percent}%`,
                    background: "#18a713",
                    height: "100%",
                    borderRadius: 6,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

   {/* MINI KALENDAR */}
<div
  style={{
    background: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  }}
>
  <h4>Kalendarski pregled svih odsustava</h4>
  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
    {events
      .slice() // kopiramo array da ne mutiramo state
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 10)
      .map((e) => (
        <div
          key={e.id}
          style={{
            padding: "5px 10px",
            borderRadius: 6,
            fontSize: 12,
            background:
              e.status === "APPROVED"
                ? "#bbf7d0"
                : e.status === "REJECTED"
                ? "#fecaca"
                : "#fde68a",
          }}
        >
          {new Date(e.startDate).toLocaleDateString()}
        </div>
      ))}
  </div>
</div>

      <div style={{ display: "flex", gap: 20 }}>
        {/* FORMA */}
        <div
          style={{
            flex: 1,
            background: "white",
            padding: 20,
            borderRadius: 10,
          }}
        >
          <h3>Novi zahtev</h3>

          <form onSubmit={handleSubmit}>
            <select
              value={newEvent.leaveTypeId}
              onChange={(e) =>
                setNewEvent((prev) => ({ ...prev, leaveTypeId: e.target.value }))
              }
              style={inputStyle}
              required
            >
              <option value="">Tip odsustva</option>
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={newEvent.startDate}
              onChange={(e) =>
                setNewEvent((prev) => ({ ...prev, startDate: e.target.value }))
              }
              style={inputStyle}
              required
            />

            <input
              type="date"
              value={newEvent.endDate}
              onChange={(e) =>
                setNewEvent((prev) => ({ ...prev, endDate: e.target.value }))
              }
              style={inputStyle}
              required
            />

            {requestedDays > 0 && (
              <p>
                Trajanje: <strong>{requestedDays} radnih dana</strong>
              </p>
            )}

            <textarea
              value={newEvent.note}
              onChange={(e) =>
                setNewEvent((prev) => ({ ...prev, note: e.target.value }))
              }
              placeholder="Napomena"
              style={inputStyle}
            />

            <button
              type="submit"
              style={{
                width: "100%",
                padding: 10,
                background: colors.secondary,
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Pošalji zahtev
            </button>
          </form>
        </div>

        {/* ODSUSTVA */}
        <div style={{ flex: 2 }}>
          <h3>Moja odsustva</h3>

          <select
            onChange={(e) => setFilter(e.target.value)}
            style={{ marginBottom: 10 }}
          >
            <option value="ALL">Sva</option>
            <option value="APPROVED">Odobrena</option>
            <option value="PENDING">Na čekanju</option>
            <option value="REJECTED">Odbijena</option>
          </select>

          {filteredEvents.map((e) => (
            <div
              key={e.id}
              style={{
                background: "#fff",
                padding: 15,
                marginBottom: 10,
                borderRadius: 12,
                borderLeft: `5px solid ${
                  e.status === "APPROVED"
                    ? "#22c55e"
                    : e.status === "REJECTED"
                    ? "#ef4444"
                    : "#f59e0b"
                }`,
              }}
            >
              <strong>{e.leaveType.name}</strong>
              <p>
                {new Date(e.startDate).toLocaleDateString()} →{" "}
                {new Date(e.endDate).toLocaleDateString()}
              </p>
              <p>{e.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}