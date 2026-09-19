const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;
export async function createEvent(eventData){

    const response = await fetch(`${BACKEND_URL}/events`,{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify(eventData)

    });

    const data = await response.json();

    return data;
}

