const API_URL = "http://localhost:5000";


export async function registerUser(userData){

const response = await fetch(`${API_URL}/register`, {   
    method: "POST",

    headers:{
        "Content-Type":"application/json"
    },
    body: JSON.stringify(userData)
});
const data = await response.json();
return data;
}

export async function loginUser(userData) {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    return data;
  }
