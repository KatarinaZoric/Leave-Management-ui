/* eslint-disable @typescript-eslint/no-explicit-any */

const BASE_URL = "http://localhost:3000";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Niste logovani");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Greška na serveru");
  }
  return res.json();
};

export const api = {
  // ================= AUTH =================
  login: async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    return handleResponse(res);
  },

  // ================= USERS =================
  getUsers: () =>
    fetch(`${BASE_URL}/users`, {
      headers: getHeaders(),
    }).then(handleResponse),

  // ================= LEAVE EVENTS =================
  // ADMIN
  getLeaveEvents: () =>
    fetch(`${BASE_URL}/leave-events`, {
      headers: getHeaders(),
    }).then(handleResponse),

  // USER
  getMyLeaveEvents: () =>
    fetch(`${BASE_URL}/leave-events/me`, {
      headers: getHeaders(),
    }).then(handleResponse),

  createLeaveEvent: (data: any) =>
    fetch(`${BASE_URL}/leave-events`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  approveLeave: (id: string) =>
    fetch(`${BASE_URL}/leave-events/${id}/approve`, {
      method: "PATCH",
      headers: getHeaders(),
    }).then(handleResponse),

  rejectLeave: (id: string, reason: string) =>
    fetch(`${BASE_URL}/leave-events/${id}/reject`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ reason }), // <-- dodajemo razlog
    }).then(handleResponse),


  // ================= TYPES =================
  getLeaveTypes: () =>
    fetch(`${BASE_URL}/leave-types`, {
      headers: getHeaders(),
    }).then(handleResponse),

  // ================= BALANCE =================
  // ADMIN pregled
  getLeaveBalances: () =>
    fetch(`${BASE_URL}/leave-balance`, {
      headers: getHeaders(),
    }).then(handleResponse),

  // USER balance
  getMyLeaveBalance: async () => {
  const res = await fetch(`${BASE_URL}/leave-balance/my`, {
    headers: getHeaders(),
  });

  const data = await handleResponse(res);
  
  // Na primer, ako backend vraća listu balansa po godinama, uzmemo trenutnu godinu
  const currentYear = new Date().getFullYear();
  const currentBalance = data.find((b: any) => b.year === currentYear);

  return currentBalance ?? { usedDays: 0, totalDays: 0 };
},

getMyAllBalances: async () => {
  const res = await fetch(`${BASE_URL}/leave-balance/my/all`, {
    headers: getHeaders(),
  });

  const data = await handleResponse(res);

  // Mapiramo da imamo remainingDays
  return data.map((b: any) => ({
    id: b.id,
    year: b.year,
    totalDays: b.totalDays,
    usedDays: b.usedDays,
    remainingDays: b.totalDays - b.usedDays,
    validUntil: b.validUntil,
  }));
},

changePassword: async ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) => {
  const res = await fetch(`${BASE_URL}/auth/change-password`, {
    method: "PATCH", // ili "POST" zavisi od tvoje rute na backendu
    headers: getHeaders(),
    body: JSON.stringify({ oldPassword, newPassword }),
  });

  return handleResponse(res);
},

updateUserBalance: async (
  userId: string,
  totalDays: number,
  year?: number,
  remainingDays?: number
) => {
  // dohvatimo email korisnika preko userId
  const users = await api.getUsers();
  const user = users.find((u: any) => u.id === userId);
  if (!user) throw new Error("Korisnik nije pronađen");

  const body = {
    email: user.email,
    totalDays,
    remainingDays: remainingDays ?? totalDays,
    year: year ?? new Date().getFullYear(),
    validUntil: new Date(new Date().getFullYear(), 11, 31).toISOString(), // kraj godine
  };

  const res = await fetch(`${BASE_URL}/leave-balance`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  return handleResponse(res);
},

getUserBalances: async (userId: string) => {
  const res = await fetch(`${BASE_URL}/leave-balance/my/all?userId=${userId}`, {
    headers: getHeaders(),
  });
  const data = await handleResponse(res);

  return data.map((b: any) => ({
    id: b.id,
    year: b.year,
    totalDays: b.totalDays,
    usedDays: b.usedDays,
    remainingDays: b.totalDays - b.usedDays,
    validUntil: b.validUntil,
  }));
},

// ================= USERS WITH BALANCES =================
getUsersWithBalances: async () => {
  const res = await fetch(`${BASE_URL}/leave-balance/users`, {
    headers: getHeaders(),
  });

  const data = await handleResponse(res);

  // Ovde mapiramo direktno ako treba
  return data.map((u: any) => ({
    id: u.id,
    name: u.name,
    surname: u.surname,
    email: u.email,
    role: u.role,
    remainingDays: u.remainingDays, // {2025: 5, 2026: 12}
  }));
},

cancelLeave: (id: string) =>
  fetch(`${BASE_URL}/leave-events/${id}/cancel`, {
    method: "PATCH",
    headers: getHeaders(),
  }).then(handleResponse),

};