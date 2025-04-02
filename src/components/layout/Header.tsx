import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Shield, LogOut, User, Map } from "lucide-react";
import { useExamStore } from "@/store/useExamStore";
import { useTrainingStore } from "@/store/useTrainingStore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const navigate = useNavigate();
  const resetExam = useExamStore(state => state.endExam);
  const resetTraining = useTrainingStore(state => state.resetTraining);
  const { user, signOut } = useAuth();

  const handleNavigation = (path: string) => {
    // Reset both stores when navigating
    resetExam();
    resetTraining();
    navigate(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="container flex h-16 items-center px-2 sm:px-4">
        <button 
          onClick={() => handleNavigation('/')}
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
        >
          <Shield className="h-6 w-6 text-blue-600" />
          <span className="text-lg sm:text-xl font-bold">
            <span className="hidden sm:inline">SAPArchitectPrep</span>
            <span className="sm:hidden">SAP Exam Prep</span>
          </span>
        </button>
        <NavigationMenu className="ml-auto hidden md:block">
          <NavigationMenuList>
            {user ? (
              <>
                <NavigationMenuItem>
                  <button
                    onClick={() => handleNavigation('/roadmap')}
                    className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-white px-3 sm:px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900"
                  >
                    <Map className="w-4 h-4 mr-2" />
                    Roadmap
                  </button>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <button
                    onClick={() => handleNavigation('/training')}
                    className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-white px-3 sm:px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900"
                  >
                    Training
                  </button>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <button
                    onClick={() => handleNavigation('/miniexam')}
                    className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-white px-3 sm:px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900"
                  >
                    Exam
                  </button>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <button
                    onClick={() => handleNavigation('/aichat')}
                    className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-white px-3 sm:px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900"
                  >
                    AI Assistant
                  </button>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <button
                    onClick={() => handleNavigation('/profile')}
                    className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-white px-3 sm:px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile                  
                  </button>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <button
                    onClick={handleSignOut}
                    className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-white px-3 sm:px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </NavigationMenuItem>
              </>
            ) : (
              <NavigationMenuItem>
                <button
                  onClick={() => handleNavigation('/login')}
                  className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Sign In
                </button>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
}