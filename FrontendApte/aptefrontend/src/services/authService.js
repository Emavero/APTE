import apiClient from "./apiClient";

const authService = {
  register: (data) =>
    apiClient.post("users/register/", data, {
      headers: { "Content-Type": "application/json" },
    }),

  login: (data) =>
    apiClient.post("users/login/", data, {
      headers: { "Content-Type": "application/json" },
    }),

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    return apiClient.post("users/logout/");
  },

  getListUsers: () =>
    apiClient.get("users/", {
      headers: { "Content-Type": "application/json" },
    }),

  updatePassword: (data) => {
  const token = localStorage.getItem("token");
  return apiClient.patch("users/update/", data, {
    headers: { 
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
},

resetPassword: (data) => {
  return apiClient.post("users/reset-password/", data, {
    headers: { "Content-Type": "application/json" },
  });
},

};

export default authService;
