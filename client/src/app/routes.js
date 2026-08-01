import { createBrowserRouter, redirect } from "react-router";
import Layout from "./Layout";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Calendar from "./pages/Calendar";
import Subjects from "./pages/Subjects";
import Pomodoro from "./pages/Pomodoro";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Login from './pages/Login';
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";

const requireAuth = () => {
  if (!localStorage.getItem("token")) {
    throw redirect("/login");
  }
  return null;
};

const redirectAuthenticatedUser = () => {
  if (localStorage.getItem("token")) {
    throw redirect("/");
  }
  return null;
};

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
    loader: redirectAuthenticatedUser,
    },
    {
    path: "/Signup",
    Component: Signup,
    loader: redirectAuthenticatedUser,
    },
    {
      path:"/ForgotPassword",
      Component: ForgotPassword,
      loader: redirectAuthenticatedUser,
    },
    {
    path: "/",
    Component: Layout,
    loader: requireAuth,
    children: [
      { index: true, Component: Dashboard },
      { path: "tasks", Component: Tasks },
      { path: "calendar", Component: Calendar },
      { path: "subjects", Component: Subjects },
      { path: "pomodoro", Component: Pomodoro },
      { path: "analytics", Component: Analytics },
      { path: "profile", Component: Profile },
      { path: "settings", Component: Settings },
    ],
  },
]);
