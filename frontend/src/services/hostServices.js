export async function createHostApplication(applicationData) {

    const response = await fetch(
        "https://eventwaa-production-7fbb.up.railway.app/host-applications",
        {
            method: "POST",
            body: applicationData,
        }
    );

    return await response.json();
}