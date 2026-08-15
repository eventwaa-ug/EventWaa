export async function createHostApplication(applicationData) {

    const response = await fetch(
        "http://localhost:5000/host-applications",
        {
            method: "POST",
            body: applicationData,
        }
    );

    return await response.json();
}