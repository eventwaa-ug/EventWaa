import { createContext, useContext, useEffect, useState } from "react";

const PlatformSettingsContext = createContext();

export function PlatformSettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    platformName: "EventWaa",
    platformLogo: "",
  });

  const fetchSettings = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/admin/settings"
      );

      const data = await response.json();

      setSettings({
        platformName: data.platformName || "EventWaa",
        platformLogo: data.platformLogo || "",
      });
    } catch (error) {
      console.error(
        "Failed to load platform settings",
        error
      );
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <PlatformSettingsContext.Provider
      value={{
        settings,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </PlatformSettingsContext.Provider>
  );
}

export function usePlatformSettings() {
  return useContext(PlatformSettingsContext);
}