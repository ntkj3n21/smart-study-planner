import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { authApi } from "../../api/authApi";

import Input from "../components/Input";
import Button from "../components/Button";

export default function Login() {
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    let isValid = true;

    if (!email.trim()) {
      setEmailError("Field is required");
      isValid = false;
    } else {
      setEmailError("");
    }

    if (!password.trim()) {
      setPasswordError("Field is required");
      isValid = false;
    } else {
      setPasswordError("");
    }

    if (isValid) {
      try {
        const response: any = await authApi.login({ email, password });
        const resData = response.data || response; 

        if (resData.token) {
          const userToSave = {
            fullName: resData.user?.fullName || "User",
            email: resData.email,
            createdAt: resData.createdAt
          };
          localStorage.setItem("token", resData.token);
          localStorage.setItem("user", JSON.stringify(userToSave)); 
          window.dispatchEvent(new Event('profileUpdated'));
          navigate("/");
        }
      } catch (error: any) {
        console.error("Login Error:", error);
        const beErrorMessage = error.response?.data?.message || "Login failed. Please check your credentials.";
        setPasswordError(beErrorMessage); 
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center !bg-[#F8FAFC]">
      {/* Sửa Responsive khung chính ở đây */}
      <div 
        className="!bg-white overflow-hidden flex flex-col md:flex-row w-[90%] max-w-[1100px] min-h-[500px] md:h-[600px] shadow-[0px_10px_30px_rgba(0,0,0,0.08)] rounded-[24px]"
      >
        {/* Sửa form chiếm full width trên mobile, padding nhỏ lại */}
        <div className="w-full md:w-1/2 flex flex-col !bg-white p-6 sm:p-8 md:p-12">
          <div className="mb-6 md:mb-8">
            <h1 className="text-[20px] md:text-[24px] font-bold !text-primary">
              Smart Study Planner
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 md:gap-6 flex-1">
            <div className="space-y-2">
              <h2 className="text-[28px] md:text-[32px] font-bold !text-[#111827]">
                Sign in
              </h2>
              <p className="text-[14px] md:text-[16px] !text-[#6B7280]">
                Built for busy students like you.
              </p>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-[14px] font-medium block !text-[#374151]">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                label=""
                error={emailError} 
                onChange={(e: any) => {
                  setEmail(e.target.value);
                  if (e.target.value) setEmailError(""); 
                }}
                className={`h-[48px] rounded-[12px] border ${emailError ? "border-red-500" : ""}`}
                style={{ 
                  borderColor: emailError ? "#EF4444" : "#E5E7EB",
                  backgroundColor: "#FFFFFF",
                  color: "#111827" 
                }}
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-[14px] font-medium block !text-[#374151]">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  label=""
                  error={passwordError} 
                  onChange={(e: any) => {
                    setPassword(e.target.value);
                    if (e.target.value) setPasswordError("");
                  }}
                  className={`h-[48px] rounded-[12px] border pr-12 ${passwordError ? "border-red-500" : ""}`}
                  style={{ 
                    borderColor: passwordError ? "#EF4444" : "#E5E7EB",
                    backgroundColor: "#FFFFFF",
                    color: "#111827" 
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[24px] -translate-y-1/2 !text-gray-500 hover:!text-gray-700 z-10 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end -mt-2">
              <Link to="/forgotpassword" className="text-[14px] font-medium hover:underline transition-all !text-primary">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-[48px] rounded-[12px] font-medium cursor-pointer hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#2563EB", color: "#FFFFFF" }}
            >
              Continue
            </Button>

            <div className="text-center">
              <p className="text-sm !text-[#6B7280]">
                Don't have an account?{' '}
                <Link to="/signup" className="font-medium hover:underline transition-all !text-primary">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Ẩn Banner bằng class 'hidden md:flex' */}
        <div 
          className="hidden md:flex w-1/2 flex-col items-center justify-center text-center p-12 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)", borderRadius: "0 24px 24px 0" }}
        >
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1769794370964-78412732f1cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwc3R1ZHklMjBkZXNrJTIwbGFwdG9wJTIwbm90ZWJvb2slMjBtaW5pbWFsfGVufDF8fHx8MTc3MjUyMTQ3Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`,
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          />
          <div className="relative z-10 space-y-4 max-w-md">
            <h3 className="text-[28px] font-bold leading-snug !text-[#FFFFFF]">
              Manage your classes, tasks and exams easily.
            </h3>
            <p className="text-[16px] text-white/80">
              Plan your study schedule and stay organized.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
