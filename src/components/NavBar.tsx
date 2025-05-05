
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User, Edit } from "lucide-react";
import { Link } from "react-router-dom";

export function NavBar() {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-background border-b sticky top-0 z-10">
      <div className="container flex h-16 items-center justify-between">
        <div>
          <Link to="/" className="text-xl font-bold">
            Team Profile Nexus
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {user && (
            <>
              <span className="text-sm hidden md:inline-flex items-center">
                <User className="mr-1 h-4 w-4" /> {user.email}
              </span>
              <Link to="/edit-profile">
                <Button 
                  variant="outline" 
                  size="sm"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={signOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
