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
};

export default authService;
