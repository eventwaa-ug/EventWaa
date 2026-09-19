import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Maintenance from "../pages/Maintenance";

/* ============================================================
   BACKEND API URL
============================================================ */

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;

/* ============================================================
   MAINTENANCE GUARD
============================================================ */

function MaintenanceGuard({ children }) {
    const location = useLocation();

    const [maintenance, setMaintenance] =
        useState(false);

    const [checking, setChecking] =
        useState(true);

    /* ========================================================
       ROUTE CHECKS
    ======================================================== */

    /*
     * Admin must always be able to access
     * the dashboard.
     */

    const isAdminRoute =
        location.pathname.startsWith("/admin");

    /*
     * Login and register must remain available.
     * Otherwise users could be completely locked out.
     */

    const isAuthRoute =
        location.pathname === "/login" ||
        location.pathname === "/register";

    /* ========================================================
       CHECK MAINTENANCE STATUS
    ======================================================== */

    useEffect(() => {
        /*
         * Never block the admin dashboard.
         */

        if (
            isAdminRoute ||
            isAuthRoute
        ) {
            setMaintenance(false);
            setChecking(false);
            return;
        }

        const checkMaintenance =
            async () => {
                try {
                    if (!BACKEND_URL) {
                        console.error(
                            "VITE_API_BASE_URL is not configured."
                        );

                        /*
                         * If the API URL is missing,
                         * don't put the whole site
                         * into maintenance mode.
                         */

                        setMaintenance(false);
                        return;
                    }

                    const response =
                        await fetch(
                            `${BACKEND_URL}/admin/settings`
                        );

                    /*
                     * Settings endpoint should
                     * normally return 200.
                     */

                    if (response.ok) {
                        const data =
                            await response.json();

                        setMaintenance(
                            data?.maintenanceMode === true
                        );
                    } else {
                        /*
                         * If the settings endpoint
                         * itself is unavailable,
                         * don't automatically put
                         * the whole frontend into
                         * maintenance mode.
                         */

                        setMaintenance(false);
                    }

                } catch (error) {
                    console.log(
                        "Unable to check maintenance status:",
                        error
                    );

                    setMaintenance(false);

                } finally {
                    setChecking(false);
                }
            };

        checkMaintenance();

    }, [
        location.pathname,
        isAdminRoute,
        isAuthRoute,
    ]);

    /* ========================================================
       LOADING
    ======================================================== */

    /*
     * While checking the backend, don't render
     * the normal application yet.
     */

    if (checking) {
        return null;
    }

    /* ========================================================
       MAINTENANCE MODE
    ======================================================== */

    if (maintenance) {
        return <Maintenance />;
    }

    /* ========================================================
       NORMAL APPLICATION
    ======================================================== */

    return children;
}

export default MaintenanceGuard;