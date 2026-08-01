import React from 'react';
import { GraduationCap } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-6">
      {/* Thêm flex-col cho mobile, giới hạn chiều cao linh hoạt min-h thay vì fix cứng */}
      <div className="w-full max-w-[1100px] min-h-[500px] md:h-[640px] bg-white rounded-3xl shadow-[0px_10px_30px_rgba(0,0,0,0.08)] flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side - Form Area: Chuyển w-1/2 thành w-full trên mobile, đệm p-6 cho mobile */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-12 flex flex-col justify-center bg-white">
          {children}
        </div>

        {/* Right Side - Gradient Panel: Thêm hidden md:flex để ẩn trên điện thoại */}
        <div 
          className="hidden md:flex w-1/2 relative items-center justify-center"
          style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)" }}
        >
          {/* Background Image */}
          <div 
            className="absolute inset-0 flex items-center justify-center opacity-10"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1769794370964-78412732f1cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwc3R1ZHklMjBkZXNrJTIwbGFwdG9wJTIwbm90ZWJvb2slMjBtaW5pbWFsfGVufDF8fHx8MTc3MjUyMTQ3Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`,
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          />

          {/* Content */}
          <div className="relative z-10 text-center px-12">
            <p className="text-white/80 text-sm mb-4">
              Everything you need to stay on track.
            </p>
            <h2 className="text-white text-[28px] font-bold leading-tight">
              Manage your classes, tasks, exams, and more. All in one place.
            </h2>
          </div>
        </div>
        
      </div>
    </div>
  );
}