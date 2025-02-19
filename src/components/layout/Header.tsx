import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Shield } from "lucide-react";
import { useExamStore } from "@/store/useExamStore";
import { useTrainingStore } from "@/store/useTrainingStore";
import { useNavigate } from "react-router-dom";

export function Header() {
  const navigate = useNavigate();
  const resetExam = useExamStore(state => state.endExam);
  const resetTraining = useTrainingStore(state => state.resetTraining);

  const handleNavigation = (path: string) => {
    // Reset both stores when navigating
    resetExam();
    resetTraining();
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="container flex h-16 items-center px-4">
        <button 
          onClick={() => handleNavigation('/')}
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
        >
          <img src="/sap_architect_logo01.jpg" alt="SAP Architect Logo" className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold">SAP Architect Prep</span>
        </button>
        <NavigationMenu className="ml-auto">
          <NavigationMenuList>
            <NavigationMenuItem>
              <button
                onClick={() => handleNavigation('/training')}
                className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                Training Deck
              </button>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <button
                onClick={() => handleNavigation('/mini-exam')}
                className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                Mini Exam
              </button>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <button
                onClick={() => handleNavigation('/ai-chat')}
                className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                AI Assistant
              </button>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
}