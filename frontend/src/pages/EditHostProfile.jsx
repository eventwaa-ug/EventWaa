import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/EditHostProfile.css";


function EditHostProfile(){

    const { user, login } = useAuth();
    const navigate = useNavigate();


    const [formData, setFormData] = useState({

        organizerName: user?.organizerName || "",
        description: user?.description || "",
        location: user?.location || "",
        contact: user?.contact || "",
        image: user?.image || ""

    });



    const handleChange = (e)=>{

        setFormData({

            ...formData,

            [e.target.name]: e.target.value

        });

    };



    const handleSubmit = (e)=>{

        e.preventDefault();


        const updateProfile = async()=>{


    const response = await fetch(
        `http://localhost:5000/users/${user.id}`,
        {
            method:"PUT",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify(formData)

        }
    );


    const data = await response.json();


    if(data.success){

        login(data.user);

        alert("Host profile updated successfully!");

        navigate(`/host/${user.id}`);

    }


};


updateProfile();

    };



    return (

        <div className="edit-host-page">


            <h1>
                Edit Host Profile
            </h1>


            <form onSubmit={handleSubmit}>


                <label>
                    Organizer Name
                </label>

                <input
                name="organizerName"
                value={formData.organizerName}
                onChange={handleChange}
                />



                <label>
                    Profile Image URL
                </label>

                <input
                name="image"
                value={formData.image}
                onChange={handleChange}
                />



                <label>
                    Location
                </label>

                <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                />



                <label>
                    About Host
                </label>


                <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                />



                <label>
                    Contact
                </label>

                <input
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                />



                <button type="submit">
                    Save Changes
                </button>


            </form>


        </div>

    );

}


export default EditHostProfile;