import React, { useContext, useState } from "react";
import { AuthContext } from "../../../AuthProviders/AuthProvider";
import { NavLink, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import img from "../../../assets/logo.jpg";
import bdLocations from "../../../../bdLocation.json";
import { Eye, EyeOff } from "lucide-react";
import { getAuth, signOut } from "firebase/auth";

const auth = getAuth();
const endpoints = import.meta.env.VITE_backendUrl;

const Registration = () => {
  const { createUser, updateUserProfile } = useContext(AuthContext);

  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedZilla, setSelectedZilla] = useState("");
  const [zillas, setZillas] = useState([]);
  const [upzillas, setUpzillas] = useState([]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [imagePreview, setImagePreview] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDivisionChange = (event) => {
    const division = event.target.value;
    setSelectedDivision(division);
    setSelectedZilla("");
    setUpzillas([]);

    // Find the selected division's zillas
    const selectedDivisionData = bdLocations.find(
      (d) => d.division === division
    );
    setZillas(selectedDivisionData ? selectedDivisionData.zillas : []);
  };

  const handleZillaChange = (event) => {
    const zilla = event.target.value;
    setSelectedZilla(zilla);

    // Find the selected zilla's upzillas
    const selectedZillaData = zillas.find((z) => z.name === zilla);
    setUpzillas(selectedZillaData ? selectedZillaData.upzillas : []);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];

    if (file) {
      // Check if the file size is greater than 10MB
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({
          title: "Error!",
          text: "Image size is too large. Please upload an image smaller than 5MB.",
          icon: "error",
        });
        setIsSubmitting(false);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result; // Get the Base64 encoded image
        setImagePreview(base64Image);
      };
      reader.readAsDataURL(file); // Convert the image to base64 without compression
    }
  };

  const navigate = useNavigate();
  const handleSignUp = (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    const form = event.target;
    const fullname = form.fullname.value;
    const username = form.username.value;
    const email = form.email.value;
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;
    const phone = form.phone.value;
    const division = form.division.value;
    const zilla = form.zilla.value;
    const upzilla = form.upzilla.value;
    const village = form.village.value;
    const image = imagePreview;
    const person =
      (fullname,
      username,
      email,
      password,
      confirmPassword,
      phone,
      division,
      zilla,
      upzilla,
      village,
      image);

    if (password !== confirmPassword) {
      alert("Password doesn't match");
      setIsSubmitting(false);
      return;
    }

    if (
      !fullname ||
      !username ||
      !email ||
      !password ||
      !confirmPassword ||
      !phone ||
      !division ||
      !zilla ||
      !upzilla ||
      !village ||
      !image
    ) {
      alert("All fields are required");
      setIsSubmitting(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Invalid email address");
      setIsSubmitting(false);
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      alert(
        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character."
      );
      setIsSubmitting(false);
      return;
    }

    console.log(person);

    createUser(email, password)
      .then((result) => {
        const user = result.user;
        console.log(user);
        updateUserProfile(username) // Update user profile in Firebase
          .then(() => {
            console.log("User profile updated");

            // Now, store additional data in MongoDB
            const userData = {
              firebase_uid: user.uid, // Firebase UID (comes from the front-end or Firebase authentication)
              fullname,
              username,
              email,
              phone,
              division,
              zilla,
              upzilla,
              village,
              image,
              password,
              confirmPassword,
            };

            // Make API call to store user data in MongoDB
            fetch(`${endpoints}/user/saveInfo`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(userData),
            })
              .then((response) => response.json())
              .then((data) => {
                if (data.success) {
                  Swal.fire({
                    title: "User Registered Successfully",
                    html: '<p style="color: red; font-weight: bold;">Email Verification link has been sent to your email address.</p>',
                    icon: "success",
                    customClass: {
                      popup: "custom-swal-popup",
                    },
                    draggable: true,
                  }).then(() => {
                    setIsSubmitting(false);
                    signOut(auth);
                    navigate("/confirmation");
                  });
                } else {
                  Swal.fire({
                    title: "Registration Failed",
                    text: data.message,
                    icon: "error",
                    draggable: true,
                  }).then(() => setIsSubmitting(false));
                }
              })
              .catch((error) => {
                console.log("Error while calling API:", error);
                Swal.fire({
                  title: "Error",
                  text: "Something went wrong while saving your data.",
                  icon: "error",
                  draggable: true,
                }).then(() => setIsSubmitting(false));
              });
          })
          .catch((error) => {
            console.log("Error updating user profile:", error);
            setIsSubmitting(false);
          });
      })
      .catch((error) => {
        if (error.code === "auth/email-already-in-use") {
          Swal.fire({
            title: "Registration Failed",
            text: "Email is already registered. Try logging in.",
            icon: "error",
          });
        } else {
          alert("An error occurred: " + error.message);
        }
        setIsSubmitting(false);
      });
  };
  return (
    <div className="bg-[#FAF7F0]">
      <NavLink to="/" className="text-black mt-5 mx-5 text-2xl">
        <div className="flex items-center">
          <img className="w-8 h-8 ml-5 mr-2" src={img} alt="" />
          <p>Lost&Found</p>
        </div>
      </NavLink>
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md bg-[#EADBC8] rounded-lg shadow-lg p-8">
          {/* Heading */}
          <h2 className="text-2xl font-bold text-center text-gray-800">
            Registration
          </h2>
          <p className="text-center text-gray-600 mt-2">
            Fill up the form to create your account
          </p>

          {/* Form */}
          <form
            onSubmit={handleSignUp}
            className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullname"
                className="block text-sm font-medium text-black"
              >
                Full Name *
              </label>
              <input
                type="text"
                id="fullname"
                placeholder="Enter your full name"
                required
                className="bg-white mt-1 w-full p-2 border border-gray-300 rounded-lg text-black"
              />
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-black"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                placeholder="Enter your username"
                required
                className="bg-white mt-1 w-full p-2 border border-gray-300 rounded-lg text-black"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-black"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                required
                className="bg-white mt-1 w-full p-2 border border-gray-300 rounded-lg text-black"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-black"
              >
                Phone Number
              </label>
              <input
                type="text"
                id="phone"
                placeholder="Enter your phone number"
                required
                className="bg-white mt-1 w-full p-2 border border-gray-300 rounded-lg text-black"
              />
            </div>

            {/* Division dropdown */}
            <div>
              <label className="block text-sm font-medium text-black">
                Division
              </label>
              <select
                value={selectedDivision}
                id="division"
                onChange={handleDivisionChange}
                className="bg-white mt-1 w-full p-2 border border-gray-300 rounded-lg text-black"
                required
              >
                <option value="">Select Division</option>
                {bdLocations.map((division) => (
                  <option key={division.division} value={division.division}>
                    {division.division}
                  </option>
                ))}
              </select>
            </div>

            {/* Zilla Dropdown */}
            <div>
              <label className="block text-sm font-medium text-black">
                Zilla
              </label>
              <select
                value={selectedZilla}
                id="zilla"
                onChange={handleZillaChange}
                className="bg-white mt-1 w-full p-2 border border-gray-300 rounded-lg text-black"
                required
                disabled={!selectedDivision}
              >
                <option value="">Select Zilla</option>
                {zillas.map((zilla) => (
                  <option key={zilla.name} value={zilla.name}>
                    {zilla.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Upzilla Dropdown */}
            <div>
              <label className="block text-sm font-medium text-black">
                Upzilla
              </label>
              <select
                className="bg-white mt-1 w-full p-2 border border-gray-300 rounded-lg text-black"
                required
                id="upzilla"
                disabled={!selectedZilla}
              >
                <option value="">Select Upzilla</option>
                {upzillas.map((upzilla) => (
                  <option key={upzilla} value={upzilla}>
                    {upzilla}
                  </option>
                ))}
              </select>
            </div>

            {/* Village */}
            <div>
              <label
                htmlFor="village"
                className="block text-sm font-medium text-black"
              >
                Village
              </label>
              <input
                type="text"
                id="village"
                placeholder="Enter your village"
                className="bg-white mt-1 w-full p-2 border border-gray-300 rounded-lg text-black"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-black"
              >
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Enter password"
                required
                className="bg-white mt-1 w-full p-2 border border-gray-300 rounded-lg text-black pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-black"
              >
                Confirm Password
              </label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                placeholder="Confirm password"
                required
                className="bg-white mt-1 w-full p-2 border border-gray-300 rounded-lg text-black pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-gray-500"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Image Upload */}
            <div className="md:col-span-2">
              <label
                htmlFor="image"
                className="block text-sm font-medium text-black"
              >
                Upload Image
              </label>
              <input
                type="file"
                accept="image/*"
                id="image"
                className="bg-white mt-1 w-full p-2 border border-gray-300 rounded-lg text-black"
                onChange={handleImageUpload}
              />

              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover"
                  />
                </div>
              )}
            </div>
            {/* Register Button */}
            <div className="md:col-span-2">
              <button
                className="mt-6 w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registering..." : "Register"}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-black mt-6">
            Already have an account? Please{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Registration;
