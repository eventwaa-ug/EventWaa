import { createContext, useContext, useState, useEffect } from "react";
export const AuthContext = createContext();
export function AuthProvider({ children }) {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );
  const login = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };
  const refreshUser = async () => {
  if (!user) return;
  try {
    const response = await fetch(
      "http://localhost:5000/users"
    );
    // ------------------------------------------------
    // MAINTENANCE MODE
    // ------------------------------------------------
    if (response.status === 503) {
      return;
    }
    if (!response.ok) {
      console.log(
        `User refresh failed. Server returned ${response.status}`
      );
      return;
    }
    const users = await response.json();
    // Make sure backend returned an array
    if (!Array.isArray(users)) {
      console.log(
        "Invalid users response:",
        users
      );
      return;
    }
    const updatedUser = users.find(
      (u) => u.email === user.email
    );
    if (updatedUser) {
      // ----------------------------------------------
      // CHECK IF ACCOUNT WAS SUSPENDED
      // ----------------------------------------------
      if (updatedUser.status === "suspended") {
        localStorage.removeItem("user");
        setUser(null);
        return;
      }
      // ----------------------------------------------
      // UPDATE LOCAL USER
      // ----------------------------------------------
      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );
      setUser(updatedUser);
    }
  } catch (error) {
    console.log(
      "User refresh failed:",
      error
    );
  }
};

  useEffect(() => {
    if (user) {
      refreshUser();
    }
  }, [user?.email]);
  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}