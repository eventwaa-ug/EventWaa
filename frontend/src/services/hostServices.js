const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;
export async function createHostApplication(applicationData) {

    const response = await fetch(
        `${BACKEND_URL}/host-applications`,
        {
            method: "POST",
            body: applicationData,
        }
    );

    return await response.json();
}