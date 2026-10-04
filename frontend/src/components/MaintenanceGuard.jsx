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
       CURRENT ROUTE
    ======================================================== */

    const pathname = location.pathname;

    /* ========================================================
       ADMIN ROUTES
       
       All admin routes must remain accessible while
       maintenance mode is enabled.

       This includes:
       - Admin login gate
       - Admin password recovery
       - Admin dashboard
       - Admin team portal
       - Admin team login
       - Admin team scanner
       - Admin team lookup
       - All /admin/* pages
    ======================================================== */

    const isAdminRoute =
        pathname === "/eventwaa-control" ||
        pathname.startsWith("/admin");

    /* ========================================================
       NORMAL USER AUTH ROUTES

       Users must still be able to log in/register so that
       maintenance mode does not create an unnecessary
       authentication dead-end.
    ======================================================== */

    const isUserAuthRoute =
        pathname === "/login" ||
        pathname === "/register";

    /* ========================================================
       ROUTES THAT BYPASS MAINTENANCE
    ======================================================== */

    const bypassMaintenance =
        isAdminRoute ||
        isUserAuthRoute;

    /* ========================================================
       CHECK MAINTENANCE STATUS
    ======================================================== */

    useEffect(() => {

        /*
         * Admin routes and authentication routes are NEVER
         * blocked by maintenance mode.
         */

        if (bypassMaintenance) {

            setMaintenance(false);
            setChecking(false);

            return;
        }

        const checkMaintenance =
            async () => {

                try {

                    /* ====================================================
                       CHECK BACKEND URL
                    ==================================================== */

                    if (!BACKEND_URL) {

                        console.error(
                            "VITE_API_BASE_URL is not configured."
                        );

                        /*
                         * Do not lock the entire application if the
                         * API URL is missing.
                         */

                        setMaintenance(false);
                        setChecking(false);

                        return;
                    }

                    /* ====================================================
                       REQUEST PLATFORM SETTINGS
                    ==================================================== */

                    const response =
                        await fetch(
                            `${BACKEND_URL}/admin/settings`
                        );

                    /* ====================================================
                       SUCCESSFUL RESPONSE
                    ==================================================== */

                    if (response.ok) {

                        const data =
                            await response.json();

                        setMaintenance(
                            data?.maintenanceMode === true
                        );

                    } else {

                        /*
                         * If the settings endpoint cannot be reached,
                         * fail open rather than accidentally locking
                         * the entire website.
                         */

                        setMaintenance(false);
                    }

                } catch (error) {

                    console.error(
                        "Unable to check maintenance status:",
                        error
                    );

                    /*
                     * Fail open if the settings request fails.
                     */

                    setMaintenance(false);

                } finally {

                    setChecking(false);
                }
            };

        checkMaintenance();

    }, [
        pathname,
        bypassMaintenance,
    ]);

    /* ========================================================
       LOADING
    ======================================================== */

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