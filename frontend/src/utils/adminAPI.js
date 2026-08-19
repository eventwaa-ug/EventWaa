const API_BASE_URL = "http://localhost:5000";

export async function adminFetch(
    endpoint,
    options = {}
) {
    const token = localStorage.getItem(
        "eventwaa_admin_token"
    );

    if (!token) {
        throw new Error(
            "Admin session not found. Please login again."
        );
    }

    const headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
    };

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers,
        }
    );

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    // =====================================================
    // ADMIN SESSION EXPIRED / INVALID
    // =====================================================

    if (response.status === 401) {

        localStorage.removeItem(
            "eventwaa_admin_token"
        );

        localStorage.removeItem(
            "eventwaa_admin"
        );

        window.location.href =
            "/admin/login";

        throw new Error(
            "Admin session expired. Please login again."
        );
    }

    if (!response.ok) {

        throw new Error(
            data.message ||
            "Admin request failed."
        );
    }

    return data;
}