import { Navigate } from "react-router-dom";

function AdminNotFound() {
    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                textAlign: "center",
                fontFamily: "Arial, sans-serif",
            }}
        >
            <div>
                <h1
                    style={{
                        fontSize: "72px",
                        margin: 0,
                        fontWeight: 700,
                    }}
                >
                    404
                </h1>

                <h2>
                    Page Not Found
                </h2>

                <p>
                    The page you are looking for
                    does not exist.
                </p>
            </div>
        </div>
    );
}

function AdminProtectedRoute({ children }) {

    const localToken =
        localStorage.getItem(
            "eventwaa_admin_token"
        );

    const sessionToken =
        sessionStorage.getItem(
            "eventwaa_admin_token"
        );

    const adminToken =
        localToken || sessionToken;

    const localAdmin =
        localStorage.getItem(
            "eventwaa_admin"
        );

    const sessionAdmin =
        sessionStorage.getItem(
            "eventwaa_admin"
        );

    const adminData =
        localAdmin || sessionAdmin;

    // ============================================================
    // NO ADMIN SESSION
    // ============================================================

    if (!adminToken || !adminData) {
        return <AdminNotFound />;
    }

    // ============================================================
    // VALIDATE ADMIN DATA
    // ============================================================

    let admin;

    try {

        admin = JSON.parse(
            adminData
        );

    } catch (error) {

        localStorage.removeItem(
            "eventwaa_admin_token"
        );

        localStorage.removeItem(
            "eventwaa_admin"
        );

        sessionStorage.removeItem(
            "eventwaa_admin_token"
        );

        sessionStorage.removeItem(
            "eventwaa_admin"
        );

        return <AdminNotFound />;
    }

    // ============================================================
    // VERIFY ADMIN ROLE
    // ============================================================

    if (
        !admin ||
        admin.role !== "admin"
    ) {

        localStorage.removeItem(
            "eventwaa_admin_token"
        );

        localStorage.removeItem(
            "eventwaa_admin"
        );

        sessionStorage.removeItem(
            "eventwaa_admin_token"
        );

        sessionStorage.removeItem(
            "eventwaa_admin"
        );

        return <AdminNotFound />;
    }

    // ============================================================
    // AUTHENTICATED ADMIN
    // ============================================================

    return children;
}

export default AdminProtectedRoute;