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

  rejectLeave: (id: string) =>
    fetch(`${BASE_URL}/leave-events/${id}/reject`, {
      method: "PATCH",
      headers: getHeaders(),
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
  getMyLeaveBalance: () =>
    fetch(`${BASE_URL}/leave-balance/my`, {
      headers: getHeaders(),
    }).then(handleResponse),
};