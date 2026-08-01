import { RouterProvider } from "react-router";
import { router } from "./routes";
import InstallPrompt from "./components/InstallPrompt";
import { registerSW } from "virtual:pwa-register";
import { useEffect } from 'react';

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("Có phiên bản mới của ứng dụng. Bạn có muốn tải lại trang?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("App đã sẵn sàng hoạt động offline!");
  },
});

export default function App() {
  
  useEffect(() => {
    document.body.classList.add('bg-[#F8FAFC]', 'dark:bg-[#0F172A]', 'overscroll-y-none');

    const savedSettings = localStorage.getItem('userSettings');
    const currentPath = window.location.pathname.toLowerCase();
    const isAuthPage = ['/login', '/signup', '/forgotpassword'].includes(currentPath);

    let themeColor = '#2563EB'; 
    let currentFontSize = 'Medium (Default)'; 

    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      
      if (parsed.appearance === 'dark' && !isAuthPage) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
      
      if (parsed.primaryColor) {
        themeColor = parsed.primaryColor;
      }

      if (parsed.fontSize) {
        currentFontSize = parsed.fontSize;
      }

    } else if (isAuthPage) {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    
    document.documentElement.style.setProperty('--color-primary', themeColor);

    const htmlRoot = document.documentElement;
    if (currentFontSize === 'Small') {
      htmlRoot.style.fontSize = '14px';
    } else if (currentFontSize === 'Large') {
      htmlRoot.style.fontSize = '18px';
    } else {
      htmlRoot.style.fontSize = '16px';
    }

  }, []); 

  return (
    <>
      <RouterProvider router={router} />
      <InstallPrompt />
    </>
  );
}