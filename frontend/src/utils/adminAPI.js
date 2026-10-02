const BACKEND_URL =
    import.meta.env.VITE_API_BASE_URL;

export async function adminFetch(
    endpoint,
    options = {}
) {
    const localToken =
        localStorage.getItem(
            "eventwaa_admin_token"
        );

    const sessionToken =
        sessionStorage.getItem(
            "eventwaa_admin_token"
        );

    const token =
        localToken || sessionToken;

    if (!token) {
        window.location.href =
            "/admin/login";

        throw new Error(
            "Admin session not found. Please login again."
        );
    }

    const headers = new Headers(
        options.headers || {}
    );

    headers.set(
        "Authorization",
        `Bearer ${token}`
    );

    /*
     * EventWaa admin POST/PUT requests send JSON.
     * Automatically set the content type whenever
     * a request has a body, unless the caller already
     * supplied its own Content-Type.
     */
    if (
        options.body &&
        !headers.has("Content-Type")
    ) {
        headers.set(
            "Content-Type",
            "application/json"
        );
    }

    const response = await fetch(
        `${BACKEND_URL}${endpoint}`,
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

    if (response.status === 401) {

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

        window.location.href =
            "/admin/login";

        throw new Error(
            data.message ||
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