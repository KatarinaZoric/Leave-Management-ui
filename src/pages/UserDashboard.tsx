import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";

// Tipovi
type LeaveType = {
  id: string;
  name: string;
  color?: string;
};

type LeaveEvent = {
  id: string;
  user: { id: string; name: string; email: string };
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  status: string;
  note?: string;
};

export default function UserDashboard() {
  const [events, setEvents] = useState<LeaveEvent[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    note: "",
  });

const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token"); // briše token
    navigate("/"); // ide na Login koji je na "/" ruti
  };


  // --- Dohvati tipove odsustva ---
  const fetchLeaveTypes = async () => {
    try {
      const data = await api.getLeaveTypes();
      setLeaveTypes(data);
    } catch (err) {
      console.error("Error fetching leave types:", err);
    }
  };

  // --- Dohvati odsustva logovanog korisnika ---
  const fetchEvents = async () => {
  try {
    setLoading(true);
    const data = await api.getLeaveEvents();

    // --- OVDE UBACUJEMO DEBUG LOGOVE I TOKEN HANDLING ---
    const token = localStorage.getItem("token");
    console.log("JWT token:", token); // ispis tokena u konzoli

    let userEmail = "";
    let userId = "";
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      console.log("JWT payload:", payload); // ispis payload-a u konzoli
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      userEmail = payload.email; // ili ako postoji, koristite payload.sub za ID
      userId = payload.sub;     // ID korisnika iz tokena
    }

    console.log("Svi događaji iz API-ja:", data);

    // --- FILTER PO ID-U JE SIGURNIJI ---
    const userEvents = data.filter((e: LeaveEvent) => e.user.id === userId);
    setEvents(userEvents);
  } catch (err) {
    console.error("Error fetching leave events:", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchLeaveTypes();
    fetchEvents();
  }, []);

  // --- Handleri ---
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setNewEvent(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewEvent(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await api.createLeaveEvent(newEvent);
      setNewEvent({ leaveTypeId: "", startDate: "", endDate: "", note: "" });
      fetchEvents(); // osvežavanje liste
    } catch (err) {
      console.error("Error creating leave event:", err);
    }
  };

  if (loading) return <p>Učitavanje podataka...</p>;

  return (
    <div style={{ padding: 20 }}>
      {/* Header sa logout dugmetom */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>User Dashboard</h1>
        <button onClick={logout} style={{ padding: "6px 12px", cursor: "pointer" }}>
          Logout
        </button>
      </div>

      {/* Prikaz odsustava */}
      <h2>Moja odsustva</h2>
      {events.length === 0 && <p>Nemate registrovanih odsustava.</p>}
      {events.map(e => (
        <div
          key={e.id}
          style={{
            border: "1px solid #ccc",
            padding: 10,
            marginBottom: 10,
            borderRadius: 8,
            backgroundColor: e.leaveType.color || "#f5f5f5",
          }}
        >
          <strong>{e.leaveType.name}</strong>
          <p>
            {new Date(e.startDate).toLocaleDateString()} → {new Date(e.endDate).toLocaleDateString()}
          </p>
          <p>Status: {e.status}</p>
          {e.note && <p>Napomena: {e.note}</p>}
        </div>
      ))}

      {/* Forma za novo odsustvo */}
      <h2>Zahtev za novo odsustvo</h2>
      <form onSubmit={handleSubmit} style={{ marginTop: 10 }}>
        <div style={{ marginBottom: 10 }}>
          <select
            name="leaveTypeId"
            value={newEvent.leaveTypeId || ""}
            onChange={handleInputChange}
            required
            style={{ width: "100%", padding: 8 }}
          >
            <option value="" disabled hidden>
              Tip odsustva
            </option>
            {leaveTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 10 }}>
          <input
            type="date"
            name="startDate"
            value={newEvent.startDate}
            onChange={handleInputChange}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <input
            type="date"
            name="endDate"
            value={newEvent.endDate}
            onChange={handleInputChange}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <textarea
            name="note"
            value={newEvent.note}
            placeholder="Napomena (nije obavezno)"
            onChange={handleTextareaChange}
            style={{ width: "100%", padding: 8, minHeight: 80 }}
          />
        </div>

        <button type="submit" style={{ width: "100%", padding: 10 }}>
          Pošalji zahtev
        </button>
      </form>
    </div>
  );
}