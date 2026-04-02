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

export default function UserDashboard() {
  const navigate = useNavigate();

  const [events, setEvents] = useState<LeaveEvent[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("ALL");

  const [remainingDays, setRemainingDays] = useState({
    currentYear: 0,
    previousYear: 0,
  });

  const [requestedDays, setRequestedDays] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  const [newEvent, setNewEvent] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    note: "",
  });

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

  const calculateRemainingDays = (events: LeaveEvent[]) => {
    const TOTAL = 20; // broj dana godišnjeg po godini
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    let usedCurrent = 0;
    let usedPrevious = 0;

    events.forEach((e) => {
      if (e.status !== "APPROVED") return;

      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      const days = countWorkingDays(start, end);

      if (start.getFullYear() === currentYear) usedCurrent += days;
      if (start.getFullYear() === previousYear) usedPrevious += days;
    });

    // Svi preostali dani iz prethodne godine
    const previousYearRemaining = Math.max(0, TOTAL - usedPrevious);

    return {
      currentYear: TOTAL - usedCurrent + previousYearRemaining, // uključuje prenesene dane
      previousYear: previousYearRemaining,
    };
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
      }

      // filtriranje samo mojih odsustava
      const userEvents = eventsData.filter(
        (e: LeaveEvent) => e.user.id === userId
      );

      setEvents(userEvents);
      setLeaveTypes(typesData);
      setRemainingDays(calculateRemainingDays(userEvents));
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

    if (requestedDays > remainingDays.currentYear)
      return alert("Nemaš dovoljno preostalih dana (uključujući prethodnu godinu).");

    try {
      await api.createLeaveEvent(newEvent); // ne šaljemo userId

      // Prikaži modal
      setSuccessMessage("Zahtev poslat. Odgovor očekujte u najkraćem roku.");
      setTimeout(() => setSuccessMessage(""), 10000);

      // Reset forme
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

  const usedDays = 20 - remainingDays.currentYear;
  const percent = (usedDays / 20) * 100;

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 20,
        background: "linear-gradient(135deg, #dbeafe, #f1f5f9)",
      }}
    >
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 30 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <img src={logo} style={{ width: 100, height: 100 }} />
          <strong>{userName}</strong>
        </div>

        <button
          onClick={logout}
          style={{
            background: colors.primary,
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {/* MODAL ZA USPEŠAN ZAHTEV */}
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

      {/* PROGRESS */}
      <div style={{ marginBottom: 20 }}>
        <p>Iskorišćeno: {usedDays} / 20 dana</p>
        <div style={{ height: 10, background: "#ddd", borderRadius: 5 }}>
          <div
            style={{
              width: `${percent}%`,
              background: colors.secondary,
              height: "100%",
              borderRadius: 5,
            }}
          />
        </div>
      </div>

      {/* MINI KALENDAR */}
      <div style={{ background: "white", padding: 15, borderRadius: 10, marginBottom: 20 }}>
        <h4>Pregled odsustava</h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {events.slice(0, 10).map((e) => (
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

      {/* MAIN */}
      <div style={{ display: "flex", gap: 20 }}>
        {/* FORMA */}
        <div style={{ flex: 1, background: "white", padding: 20, borderRadius: 10 }}>
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

          <select onChange={(e) => setFilter(e.target.value)} style={{ marginBottom: 10 }}>
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