/* eslint-disable @typescript-eslint/no-explicit-any */
const BASE_URL = "http://localhost:3000";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const api = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Login failed");
    }

    // Backend treba da vrati token i rolu usera
    return res.json(); // { access_token: string, role: "ADMIN" | "EMPLOYEE" }
  },

  getUsers: () =>
    fetch(`${BASE_URL}/users`, { headers: getHeaders() }).then((res) => res.json()),

  getLeaveEvents: () =>
    fetch(`${BASE_URL}/leave-events`, { headers: getHeaders() }).then((res) => res.json()),

  createLeaveEvent: (data: any) =>
    fetch(`${BASE_URL}/leave-events`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then((res) => res.json()),

  approveLeave: (id: string) =>
    fetch(`${BASE_URL}/leave-events/${id}/approve`, {
      method: "PATCH",
      headers: getHeaders(),
    }).then((res) => res.json()),

  rejectLeave: (id: string) =>
    fetch(`${BASE_URL}/leave-events/${id}/reject`, {
      method: "PATCH",
      headers: getHeaders(),
    }).then((res) => res.json()),

  getLeaveTypes: () =>
  fetch(`${BASE_URL}/leave-types`, { headers: getHeaders() }).then(res => res.json()),

};