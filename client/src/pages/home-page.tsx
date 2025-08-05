import { useAuth } from "@/hooks/use-auth";
import StudentDashboard from "./student-dashboard";
import StaffDashboard from "./staff-dashboard";
import AdminDashboard from "./admin-dashboard";

export default function HomePage() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case "student":
      return <StudentDashboard />;
    case "teacher":
    case "hod":
      return <StaffDashboard />;
    case "admin":
      return <AdminDashboard />;
    default:
      return <StudentDashboard />;
  }
}
