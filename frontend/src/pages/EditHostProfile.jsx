import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/EditHostProfile.css";

function EditHostProfile() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    organizerName: user?.organizerName || "",
    description: user?.description || "",
    location: user?.location || "",
    contact: user?.contact || "",
    image: user?.image || "",
  });

  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageUpload = async (file) => {
    try {
      setUploading(true);

      const uploadData = new FormData();
      uploadData.append("image", file);

      const response = await fetch(
        `http://localhost:5000/users/${user.id}/upload-image`,
        {
          method: "POST",
          body: uploadData,
        }
      );

      const data = await response.json();

      if (data.success) {
        setFormData((prev) => ({
          ...prev,
          image: data.image,
        }));

        // Update local auth state only
        login(data.user);
      } else {
        alert(data.message || "Image upload failed");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `http://localhost:5000/users/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (data.success) {
        login(data.user);

        alert("Host profile updated successfully!");
        navigate(`/host/${user.id}`);
      } else {
        alert(data.message || "Update failed");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to update profile");
    }
  };

  return (
    <div className="edit-host-page">
      <button
        className="edit-host-back-btn"
        onClick={() => navigate(-1)}
        type="button"
      >
        ← Back
      </button>

      <h1>Edit host profile</h1>
      <p className="edit-host-subtitle">
        Update your organizer information and profile photo.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="edit-host-image-section">
          <img
            src={formData.image || "https://ui-avatars.com/api/?name=Host&background=2563eb&color=fff"}
            alt="Host"
            className="edit-host-image-preview"
            />

          <label className="upload-photo-btn">
            {uploading ? "Uploading..." : "Upload photo"}
            <input
              type="file"
              accept="image/*"
              hidden
              disabled={uploading}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImageUpload(e.target.files[0]);
                }
              }}
            />
          </label>
        </div>

        <label>Organizer name</label>
        <input
          name="organizerName"
          value={formData.organizerName}
          onChange={handleChange}
          placeholder="Lewis Fashion"
        />

        <label>Location</label>
        <input
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="Gulu, Uganda"
        />

        <label>About host</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={5}
          placeholder="Tell attendees about yourself and the events you organize."
        />

        <label>Contact</label>
        <input
          name="contact"
          value={formData.contact}
          onChange={handleChange}
          placeholder="+256 7XX XXX XXX"
        />

        <button type="submit" className="save-host-btn">
          Save changes
        </button>
      </form>
    </div>
  );
}

export default EditHostProfile;