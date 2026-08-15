import { useEffect, useState } from "react";
import "./AdminUsers.css";


function AdminUsers(){

    const [users,setUsers] = useState([]);

    const [search,setSearch] = useState("");



    useEffect(()=>{

        loadUsers();

    },[]);



    const loadUsers = ()=>{

        fetch("http://localhost:5000/admin/users")

        .then(res=>res.json())

        .then(data=>{

            setUsers(data);

        });

    };



    const updateUser = async(user)=>{


        await fetch(
            `http://localhost:5000/admin/users/${user.id}`,
            {

                method:"PUT",

                headers:{

                    "Content-Type":"application/json"

                },


                body:JSON.stringify({

                    role:user.role,

                    status:user.status

                })

            }

        );


        alert("User updated successfully");


        loadUsers();


    };




    const changeRole = (id,role)=>{


        setUsers(prev=>

            prev.map(user=>

                user.id===id

                ?

                {
                    ...user,
                    role:role
                }

                :

                user

            )

        );


    };





    const toggleStatus=(id)=>{


        setUsers(prev=>

            prev.map(user=>

                user.id===id

                ?

                {

                    ...user,

                    status:
                    user.status==="suspended"

                    ?

                    "active"

                    :

                    "suspended"

                }

                :

                user

            )

        );


    };





    const filteredUsers = users.filter(user=>


        user.name
        ?.toLowerCase()
        .includes(search.toLowerCase())


        ||

        user.email
        ?.toLowerCase()
        .includes(search.toLowerCase())


    );




    return(

        <div className="admin-users">


            <h1>
                Users Management 👥
            </h1>




            <input

            className="user-search"

            placeholder="Search users..."

            value={search}

            onChange={(e)=>setSearch(e.target.value)}

            />






            <div className="users-grid">


            {
                filteredUsers.map(user=>(


                    <div

                    className="user-card"

                    key={user.id}

                    >



                    <h2>
                        {user.name}
                    </h2>



                    <p>
                        {user.email}
                    </p>




                    <p>

                    Role:

                    <select

                    value={user.role || "user"}

                    onChange={(e)=>

                    changeRole(
                        user.id,
                        e.target.value
                    )

                    }

                    >

                    <option value="user">
                        User
                    </option>


                    <option value="host">
                        Host
                    </option>


                    <option value="admin">
                        Admin
                    </option>


                    </select>


                    </p>





                    {

                    user.verifiedHost &&

                    <strong className="verified-user">

                        ✅ Verified Host

                    </strong>

                    }





                    <p>

                    Status:

                    <span

                    className={
                    user.status==="suspended"

                    ?

                    "status suspended"

                    :

                    "status active"
                    }

                    >

                    {
                    user.status || "active"
                    }

                    </span>


                    </p>






                    <div className="user-actions">


                    <button

                    className="save-user"

                    onClick={()=>
                    updateUser(user)
                    }

                    >

                    Save Changes

                    </button>





                    <button

                    className="suspend-user"

                    onClick={()=>
                    toggleStatus(user.id)
                    }

                    >

                    {

                    user.status==="suspended"

                    ?

                    "Activate"

                    :

                    "Suspend"

                    }


                    </button>


                    </div>




                    </div>


                ))
            }


            </div>



        </div>

    );

}


export default AdminUsers;