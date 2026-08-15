const API_URL = "http://localhost:5000";
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

