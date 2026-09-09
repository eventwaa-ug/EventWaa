const API_URL = "https://eventwaa-production-7fbb.up.railway.app0";
export async function createEvent(eventData){

    const response = await fetch(`${API_URL}/events`,{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify(eventData)

    });

    const data = await response.json();

    return data;
}

