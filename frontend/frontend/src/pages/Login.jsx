import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/authServices";
import { Eye, EyeOff } from "lucide-react";
import "./Login.css";
import { GoogleLogin } from "@react-oauth/google";
import { usePlatformSettings } from "../context/PlatformSettingsContext.jsx";
import { Link } from "react-router-dom";


function Login() {
  const { settings } = usePlatformSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();


  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });


  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);



  const handleChange = (e) => {

    const {name, value} = e.target;

    setFormData({
      ...formData,
      [name]: value
    });

  };



  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");
    setLoading(true);


    try {

      const response = await loginUser(formData);


      if(response.user){

        login(response.user);


        const redirect =
          location.state?.from?.pathname || "/";


        navigate(redirect);

      }
      else{

        setError(
          response.message || "Invalid email or password"
        );

      }


    } catch(err){

      setError(
        "Something went wrong. Please try again."
      );

    }


    finally{

      setLoading(false);

    }

  };



  const handleGoogleSuccess = async (credentialResponse)=>{

  try {

    const response = await fetch(
      "http://localhost:5000/google-login",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          token: credentialResponse.credential
        })
      }
    );


    const data = await response.json();


    console.log(
      "Google Login Response:",
      data
    );


    if(data.success){

      login(data.user);

      navigate("/");

    }


  } catch(error){

    console.log(error);

  }

};


return (

<div className="auth-container">


<div className="auth-card">

<div className="auth-brand">
  {settings.platformLogo ? (
    <img
      src={settings.platformLogo}
      alt={settings.platformName}
      className="auth-logo"
    />
  ) : (
    <h1>{settings.platformName}</h1>
  )}

  <p>Welcome back. Sign in to continue.</p> <br></br> <br></br> 
</div>



{error && (

<div className="error-message">

{error}

</div>

)}



<form onSubmit={handleSubmit}>


<input

type="email"

name="email"

placeholder="Email address"

value={formData.email}

onChange={handleChange}

/>




<div className="password-wrapper">


<input

type={
showPassword 
? "text"
: "password"
}

name="password"

placeholder="Password"

value={formData.password}

onChange={handleChange}

/>



<span

className="password-toggle"

onClick={() =>
setShowPassword(!showPassword)
}

>

{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}

</span>


</div>




<button

disabled={loading}

className="auth-button"

>


{
loading
?
"Logging in..."
:
"Login"
}


</button>


</form>




<div className="forgot-password">

<Link to="/forgot-password" className="forgot-password-link">
  Forgot Password?
</Link>

</div>




<div className="divider">

OR

</div>




<div className="google-login">

<GoogleLogin

onSuccess={handleGoogleSuccess}

onError={() =>
console.log("Google Login Failed")
}

/>

</div>



<p className="switch-auth">

Don't have an account?

<span

onClick={() =>
navigate("/register")
}

>

Register

</span>


</p>



</div>


</div>


);


}


export default Login;