import {
createContext,
useCallback,
useContext,
useEffect,
useState,
} from "react";

/* ============================================================
PLATFORM SETTINGS CONTEXT
============================================================ */

const PlatformSettingsContext =
createContext(null);

/* ============================================================
BACKEND URL
============================================================ */

const BACKEND_URL =
import.meta.env.VITE_API_URL ||
"http://127.0.0.1:5000";

/* ============================================================
DEFAULT SETTINGS
============================================================ */

const defaultSettings = {
platformName: "EventWaa",
platformLogo: "",
};

/* ============================================================
PLATFORM SETTINGS PROVIDER
============================================================ */

export function PlatformSettingsProvider({
children,
}) {

const [
    settings,
    setSettings,
] = useState(
    defaultSettings
);
const [
    loading,
    setLoading,
] = useState(
    true
);
/* ========================================================
   FETCH PLATFORM SETTINGS
======================================================== */
const refreshSettings =
    useCallback(
        async () => {
            try {
                setLoading(
                    true
                );
                const response =
                    await fetch(
                        `${BACKEND_URL}/admin/settings`,
                        {
                            method: "GET",
                            headers: {
                                Accept:
                                    "application/json",
                            },
                        }
                    );
                let data = {};
                try {
                    data =
                        await response.json();
                } catch {
                    data = {};
                }
                if (
                    !response.ok
                ) {
                    throw new Error(
                        data.message ||
                        "Unable to load platform settings."
                    );
                }
                setSettings({
                    platformName:
                        data.platformName ||
                        defaultSettings.platformName,
                    platformLogo:
                        data.platformLogo ||
                        defaultSettings.platformLogo,
                });
            } catch (
                error
            ) {
                console.error(
                    "PLATFORM SETTINGS ERROR:",
                    error
                );
                /*
                 * Keep the default settings
                 * if the backend is temporarily
                 * unavailable.
                 */
                setSettings(
                    defaultSettings
                );
            } finally {
                setLoading(
                    false
                );
            }
        },
        []
    );
/* ========================================================
   LOAD SETTINGS ON START
======================================================== */
useEffect(() => {
    refreshSettings();
}, [
    refreshSettings,
]);
/* ========================================================
   PROVIDER
======================================================== */
return (
    <PlatformSettingsContext.Provider
        value={{
            settings,
            loading,
            refreshSettings,
        }}
    >
        {children}
    </PlatformSettingsContext.Provider>
);

}

/* ============================================================
CUSTOM HOOK
============================================================ */

export function usePlatformSettings() {

const context =
    useContext(
        PlatformSettingsContext
    );
if (
    !context
) {
    throw new Error(
        "usePlatformSettings must be used inside PlatformSettingsProvider."
    );
}
return context;

}