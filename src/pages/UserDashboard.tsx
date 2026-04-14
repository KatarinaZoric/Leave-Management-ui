/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  rejectReason?: string;
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

  // ================= PASSWORD MODAL =================
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");

  // 🎨 COLORS
  const colors = {
    primary: "#1e3a8a",
    secondary: "#3b82f6",
  };

  /*const inputStyle = {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    border: "1px solid #cbd5f5",
  };
  */

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

        // fetch leave balances
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
      if (existing.status !== "APPROVED") return false;
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

      setSuccessMessage("Zahtev poslat. Odgovor očekujte u najkraćem roku.");
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

  // ================= CHANGE PASSWORD =================
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = passwordForm;

    if (newPassword !== confirmPassword) {
      setPasswordMessage("Lozinke se ne poklapaju!");
      return;
    }

    try {
      await api.changePassword({ oldPassword, newPassword });
      setPasswordMessage("Lozinka uspešno promenjena!");
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setShowChangePassword(false);
    } catch (err: any) {
      setPasswordMessage(err.response?.data?.message || "Greška pri promeni lozinke");
    }
  };

  if (loading) return <p>Učitavanje...</p>;

  const filteredEvents =
    filter === "ALL"
      ? events
      : events.filter((e) => e.status === filter);

      const cancelLeave = async (id: string) => {
  if (!confirm("Da li želiš da otkažeš odsustvo?")) return;

  try {
    await api.cancelLeave(id);
    fetchData();
  } catch (err) {
    console.error(err);
    alert("Greška pri otkazivanju odsustva");
  }
};

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 20,
        background: "linear-gradient(135deg, #dbeafe, #f1f5f9)",
      }}
    >
     {/* HEADER */}
{/* HEADER */}
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
    padding: 20,
    borderRadius: 10,
    backgroundColor: "#0077cc", // tamno plava
    height: 220,
    boxSizing: "border-box",
  }}
>
  {/* Leva strana */}
  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
    <img
      src={logo}
      style={{
        width: 200,
        height: 200,
        objectFit: "contain",
        borderRadius: 8,
        // border uklonjen
      }}
    />
    <strong
      style={{
        fontSize: 26,
        color: "#e0f7ff", // svetloplava boja teksta
      }}
    >
      {userName}, dobrodošli u CPSUNS evidenciju odsustava
    </strong>
  </div>

  {/* Desna strana dugmadi */}
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      gap: 10,
    }}
  >
    <button
      onClick={() => setShowChangePassword(true)}
      style={{
        background: "#e0f7ff", // svetlo zelena
        color: "#667474", // tamno plavi tekst
        border: "none",
        padding: "6px 12px",
        borderRadius: 6,
        cursor: "pointer",
        fontSize: 14,
        fontWeight: "bold",
      }}
    >
      Promeni lozinku
    </button>

    <button
      onClick={logout}
      style={{
        background: "#e0f7ff", // svetlo plava
        color: "#667474", // tamno plavi tekst
        border: "none",
        padding: "6px 12px",
        borderRadius: 6,
        cursor: "pointer",
        fontSize: 14,
        fontWeight: "bold",
      }}
    >
      Odjavi se
    </button>
  </div>
</div>

      {/* SUCCESS MODAL */}
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
{/* CHANGE PASSWORD MODAL */}
{showChangePassword && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1001,
      padding: 20, // dodat razmak na malim ekranima
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        background: "white",
        padding: 30,
        borderRadius: 10,
        width: "100%",
        maxWidth: 450,
        boxSizing: "border-box",
      }}
    >
      <h3 style={{ textAlign: "center", marginBottom: 20 }}>Promena lozinke</h3>

      <form
        onSubmit={handleChangePassword}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <input
          type="password"
          placeholder="Stara lozinka"
          value={passwordForm.oldPassword}
          onChange={(e) =>
            setPasswordForm((prev) => ({ ...prev, oldPassword: e.target.value }))
          }
          style={{
            width: "100%",
            maxWidth: 400,
            padding: 10,
            marginBottom: 15,
            borderRadius: 6,
            border: "1px solid #ccc",
            boxSizing: "border-box",
          }}
          required
        />

        <input
          type="password"
          placeholder="Nova lozinka"
          value={passwordForm.newPassword}
          onChange={(e) =>
            setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
          }
          style={{
            width: "100%",
            maxWidth: 400,
            padding: 10,
            marginBottom: 15,
            borderRadius: 6,
            border: "1px solid #ccc",
            boxSizing: "border-box",
          }}
          required
        />

        <input
          type="password"
          placeholder="Potvrdi novu lozinku"
          value={passwordForm.confirmPassword}
          onChange={(e) =>
            setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
          }
          style={{
            width: "100%",
            maxWidth: 400,
            padding: 10,
            marginBottom: 15,
            borderRadius: 6,
            border: "1px solid #ccc",
            boxSizing: "border-box",
          }}
          required
        />

        {passwordMessage && (
          <p style={{ color: "red", marginBottom: 10, textAlign: "center" }}>
            {passwordMessage}
          </p>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            maxWidth: 400,
          }}
        >
          <button
            type="submit"
            style={{
              background: "#3b82f6",
              color: "white",
              border: "none",
              padding: "8px 12px",
              borderRadius: 6,
              cursor: "pointer",
              flex: 1,
              marginRight: 10,
            }}
          >
            Promeni
          </button>
          <button
            type="button"
            onClick={() => setShowChangePassword(false)}
            style={{
              background: "#ef4444",
              color: "white",
              border: "none",
              padding: "8px 12px",
              borderRadius: 6,
              cursor: "pointer",
              flex: 1,
            }}
          >
            Otkaži
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* LEAVE BALANCE */}
      <div style={{ marginBottom: 20 }}>
        <h3>Pregled slobodnih dana</h3>
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
                    background: "#6edd6a",
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
  <h4>Kalendarski pregled zakazanih odsustava</h4>
  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
    {events
      .filter((e) => e.status === "APPROVED") // filtriranje samo odobrenih odsustava
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 10)
      .map((e) => (
        <div
          key={e.id}
          style={{
            padding: "5px 10px",
            borderRadius: 6,
            fontSize: 12,
            background: "#bbf7d0", // samo odobrena, pa direktno zelena
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
    background: "#b3e8aa",
    padding: 20,       // smanjen padding
    borderRadius: 10,
    boxSizing: "border-box",
    width: "100%",
    maxWidth: 450,
    margin: "20px auto",
  }}
>
  <h3 style={{ textAlign: "center", marginBottom: 15 }}>Novi zahtev</h3>

  <form
    onSubmit={handleSubmit}
    style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
  >
    {/* Tip odsustva */}
    <select
      value={newEvent.leaveTypeId}
      onChange={(e) =>
        setNewEvent((prev) => ({ ...prev, leaveTypeId: e.target.value }))
      }
      style={{
        width: "100%",
        padding: 8,       // manje paddinga
        marginBottom: 10, // manja margina
        borderRadius: 6,
        border: "1px solid #ccc",
        boxSizing: "border-box",
      }}
      required
    >
      <option value="">Tip odsustva</option>
      {leaveTypes.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>

    {/* Datumi */}
    <input
      type="date"
      value={newEvent.startDate}
      onChange={(e) =>
        setNewEvent((prev) => ({ ...prev, startDate: e.target.value }))
      }
      style={{
        width: "100%",
        padding: 8,
        marginBottom: 10,
        borderRadius: 6,
        border: "1px solid #ccc",
        boxSizing: "border-box",
      }}
      required
    />

    <input
      type="date"
      value={newEvent.endDate}
      onChange={(e) =>
        setNewEvent((prev) => ({ ...prev, endDate: e.target.value }))
      }
      style={{
        width: "100%",
        padding: 8,
        marginBottom: 10,
        borderRadius: 6,
        border: "1px solid #ccc",
        boxSizing: "border-box",
      }}
      required
    />

    {/* Trajanje */}
    {requestedDays > 0 && (
      <p style={{ marginBottom: 10, textAlign: "center" }}>
        Trajanje: <strong>{requestedDays} radnih dana</strong>
      </p>
    )}

    {/* Napomena */}
    <textarea
      value={newEvent.note}
      onChange={(e) =>
        setNewEvent((prev) => ({ ...prev, note: e.target.value }))
      }
      placeholder="Napomena"
      style={{
        width: "100%",
        padding: 8,
        marginBottom: 15,
        borderRadius: 6,
        border: "1px solid #ccc",
        boxSizing: "border-box",
        resize: "vertical",
        height: 60,  // ograničena visina
      }}
    />

    {/* Dugme */}
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
        fontSize: 16,
      }}
    >
      Pošalji zahtev
    </button>
  </form>
</div>

        {/* ODSUSTVA */}
        <div style={{ flex: 2 }}>
          <h3>Moji zahtevi</h3>

          <select
            onChange={(e) => setFilter(e.target.value)}
            style={{ marginBottom: 10 }}
          >
            <option value="ALL">Svi</option>
            <option value="APPROVED">Odobreni</option>
            <option value="PENDING">Na čekanju</option>
            <option value="REJECTED">Odbijeni</option>
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
    <p>Status: {e.status}</p>

    {/* Prikaz razloga odbijanja */}
    {e.status === "REJECTED" && e.rejectReason && (
      <p style={{ color: "red", marginTop: 5 }}>
        <strong>Obrazloženje odbijanja:</strong> {e.rejectReason}
      </p>
    )}

    {/* Prikaz napomene ako postoji */}
    {e.note && (
      <p style={{ marginTop: 5 }}>
        <strong>Napomena:</strong> {e.note}
      </p>
    )}

    {(e.status === "PENDING" || e.status === "APPROVED") && (
  <button
    onClick={() => cancelLeave(e.id)}
    style={{
      marginTop: 10,
      padding: "6px 10px",
      borderRadius: 6,
      border: "none",
      background: "#ef4444",
      color: "#fff",
      cursor: "pointer",
    }}
  >
    Otkaži
  </button>
)}
  </div>
))}
        </div>
      </div>
    </div>
  );
}