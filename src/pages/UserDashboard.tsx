import { useEffect, useState } from "react";
import { api } from "../services/api";

// src/pages/UserDashboard.tsx

type LeaveType = {
  id: string;
  name: string;
  color?: string;
};

type LeaveEvent = {
  id: string;
  user: { name: string; email: string };
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  status: string;
};

export default function UserDashboard() {
  const [events, setEvents] = useState<LeaveEvent[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
  });

  // Dohvati tipove odsustva
  const fetchLeaveTypes = async () => {
    try {
      const data = await api.getLeaveTypes();
      setLeaveTypes(data);
    } catch (err) {
      console.error("Error fetching leave types:", err);
    }
  };

  // Dohvati odsustva logovanog korisnika
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await api.getLeaveEvents();

      const token = localStorage.getItem("token");
      let userEmail = "";
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        userEmail = payload.email;
      }

      const userEvents = data.filter((e: LeaveEvent) => e.user.email === userEmail);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewEvent({ ...newEvent, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLeaveEvent(newEvent);
      setNewEvent({ leaveTypeId: "", startDate: "", endDate: "" });
      fetchEvents(); // refresh list
    } catch (err) {
      console.error("Error creating leave event:", err);
    }
  };

  if (loading) return <p>Učitavanje podataka...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>User Dashboard</h1>

      <h2>Moja odsustva</h2>
      {events.length === 0 && <p>Nemate registrovanih odsustava.</p>}
      {events.map((e) => (
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
            {new Date(e.startDate).toLocaleDateString()} →{" "}
            {new Date(e.endDate).toLocaleDateString()}
          </p>
          <p>Status: {e.status}</p>
        </div>
      ))}

      <h2>Zahtev za novo odsustvo</h2>
      <form onSubmit={handleSubmit} style={{ marginTop: 10 }}>
        <div style={{ marginBottom: 10 }}>
          <select
            name="leaveTypeId"
            value={newEvent.leaveTypeId}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: 8 }}
          >
            <option value="">Izaberite tip odsustva</option>
            {leaveTypes.map((type) => (
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
            onChange={handleChange}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <input
            type="date"
            name="endDate"
            value={newEvent.endDate}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        <button type="submit" style={{ padding: 10, width: "100%" }}>
          Pošalji zahtev
        </button>
      </form>
    </div>
  );
}