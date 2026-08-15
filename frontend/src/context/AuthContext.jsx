import {
  createContext,
  useContext,
  useState,
  useEffect
} from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {

  const [user, setUser] = useState(
    JSON.parse(
      localStorage.getItem("user")
    ) || null
  );


  // ==========================================================
  // LOGIN
  // ==========================================================

  const login = (userData) => {

    localStorage.setItem(
      "user",
      JSON.stringify(userData)
    );

    setUser(userData);
  };


  // ==========================================================
  // REFRESH USER
  // ==========================================================

  const refreshUser = async () => {

    if (!user) return;

    try {

      const response = await fetch(
        "http://localhost:5000/users"
      );

      // ------------------------------------------------------
      // MAINTENANCE MODE
      // ------------------------------------------------------

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

      // ------------------------------------------------------
      // MAKE SURE BACKEND RETURNED ARRAY
      // ------------------------------------------------------

      if (!Array.isArray(users)) {

        console.log(
          "Invalid users response:",
          users
        );

        return;
      }

      // ------------------------------------------------------
      // FIND CURRENT USER
      // ------------------------------------------------------

      const updatedUser = users.find(
        (u) =>
          u.email === user.email
      );

      if (updatedUser) {

        // ----------------------------------------------------
        // CHECK IF ACCOUNT WAS SUSPENDED
        // ----------------------------------------------------

        if (
          updatedUser.status === "suspended"
        ) {

          localStorage.removeItem(
            "user"
          );

          setUser(null);

          return;
        }

        // ----------------------------------------------------
        // UPDATE LOCAL USER
        // ----------------------------------------------------

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


  // ==========================================================
  // UPLOAD PROFILE PHOTO
  // ==========================================================

  const uploadProfilePhoto = async (file) => {

    if (!user?.id) {

      throw new Error(
        "You must be logged in to upload a profile photo."
      );
    }

    if (!file) {

      throw new Error(
        "Please select a photo."
      );
    }

    const formData = new FormData();

    formData.append(
      "photo",
      file
    );

    const response = await fetch(
      `http://localhost:5000/users/${user.id}/profile-photo`,
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();

    if (!response.ok) {

      throw new Error(
        data.message ||
        "Unable to upload profile photo."
      );
    }

    // --------------------------------------------------------
    // UPDATE LOCAL USER
    // --------------------------------------------------------

    if (data.user) {

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      setUser(data.user);
    }

    return data;
  };


  // ==========================================================
  // AUTO REFRESH USER
  // ==========================================================

  useEffect(() => {

    if (user) {
      refreshUser();
    }

  }, [user?.email]);


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = () => {

    localStorage.removeItem(
      "user"
    );

    setUser(null);
  };


  return (

    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        refreshUser,
        uploadProfilePhoto
      }}
    >

      {children}

    </AuthContext.Provider>

  );
}


// ============================================================
// useAuth
// ============================================================

export function useAuth() {

  return useContext(
    AuthContext
  );
}