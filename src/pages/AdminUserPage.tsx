/* eslint-disable @typescript-eslint/no-explicit-any */

import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import jsPDF from "jspdf";

export default function AdminUserPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [remainingDays, setRemainingDays] = useState<number>(0);

  /* ================= FETCH ================= */
  const fetchUser = async () => {
    const data = await api.getUserLeaves(id); // ova metoda postoji

setUser({
  name: data.name,
  surname: data.surname,
});
setLeaves(data.leaves || []);
setRemainingDays(data.remainingDays || 0);

  useEffect(() => {
    fetchUser();
  }, []);

  /* ================= PDF ================= */
  const generatePDF = () => {
    const pdf = new jsPDF();

    pdf.setFontSize(16);
    pdf.text(`${user.name} ${user.surname}`, 10, 15);

    pdf.setFontSize(12);
    pdf.text(`Preostali dani odmora: ${remainingDays}`, 10, 25);

    let y = 40;

    pdf.text("Zakazana odsustva:", 10, y);
    y += 10;

    // ======== LOOP ZA ODSUSTVA =========
    leaves.forEach((l: any) => {
      pdf.text(
        `${l.leaveType} | ${new Date(l.startDate).toLocaleDateString()} - ${new Date(l.endDate).toLocaleDateString()}`,
        10,
        y
      );
      if (l.note) {
        y += 6;
        pdf.text(`Napomena: ${l.note}`, 10, y);
      }
      y += 8;
    });

    pdf.save(`${user.name}_odsustva.pdf`);
  };

  if (!user) return <p>Loading...</p>;

  /* ================= UI ================= */
  return (
    <div
      style={{
        padding: 30,
        background: "#f4f7fb",
        minHeight: "100vh",
        fontFamily: "Arial",
      }}
    >
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate(-1)}
        style={{ marginBottom: 20 }}
      >
        ← Nazad
      </button>

      {/* HEADER CARD */}
      <div
        style={{
          background: "#fff",
          padding: 25,
          borderRadius: 12,
          marginBottom: 20,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        }}
      >
        <h2>{user.name} {user.surname}</h2>

        {/* OVDE PIŠE PREOSTALI DANI UMESTO EMAILA */}
        <p>Preostali dani odmora: {remainingDays}</p>
      </div>

      {/* STATS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 20,
          marginBottom: 20,
        }}
      >
        <StatCard title="Preostali dani" value={remainingDays} />
        <StatCard title="Ukupno odsustava" value={leaves.length} />
        <StatCard title="Godina" value={new Date().getFullYear()} />
      </div>

      {/* LEAVES TABLE */}
      <div
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 12,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        }}
      >
        <h3>Zakazana odsustva</h3>

        {leaves.length === 0 && <p>Nema odsustava.</p>}

        {leaves.map((l: any) => (
          <div
            key={l.id}
            style={{
              padding: 10,
              borderBottom: "1px solid #eee",
            }}
          >
            <strong>{l.leaveType}</strong>
            <p>
              {new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()}
            </p>
            {l.note && <p>Napomena: {l.note}</p>}
          </div>
        ))}
      </div>

      {/* PDF BUTTON */}
      <div style={{ marginTop: 20 }}>
        <button
          onClick={generatePDF}
          style={{
            padding: 12,
            borderRadius: 8,
            background: "#2f80ed",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Export PDF
        </button>
      </div>
    </div>
  );
}

/* ================= STAT CARD ================= */
function StatCard({ title, value }: any) {
  return (
    <div
      style={{
        background: "#fff",
        padding: 20,
        borderRadius: 12,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      }}
    >
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}