// client/src/App.tsx

import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import Home from "@/pages/Home";
import Lesson from "@/pages/Lesson";
import NotFound from "@/pages/not-found";
import AppHeader from "@/components/AppHeader";
import { FRONTEND_BASE_PATH } from './config';
import { LanguageProvider } from "@/lib/languageProvider";
import PasswordGate from "@/components/PasswordGate"; // Path to your new component
import { authenticateApp, logout } from "@/utils/auth"; // Path to your new auth utilities
import { AuthContext } from "@/lib/authContext"; 

 const handleLogout = () => {
   logout(); // This will clear the password and reload the page
 };

function AppRoutes() {
  const [location] = useLocation();
  console.log("Wouter's current path 202507191200:", location);

  return (
    <Switch>
      <Route path="/" component={Home} />
      {/* This will match when index.html is explicitly in the URL */}
      <Route path="/index.html" component={Home} /> 
      {/* If you have other top-level routes for your app. Assuming topics are displayed on Home page based on previous discussion */}
      <Route path="/topics" component={Home} /> 
      <Route path="/lesson/:id" component={Lesson} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authAttempted, setAuthAttempted] = useState<boolean>(false); // To prevent flashing login screen

  useEffect(() => {
    const tryAutoAuthenticate = async () => {
      // Get the stored password directly from localStorage in this effect
      // as `authenticateApp` expects it.
      const storedPassword = localStorage.getItem("lang2lang_access_password");

      if (storedPassword) {
        console.log("Attempting auto-authentication...");
        const success = await authenticateApp(storedPassword);
        setIsAuthenticated(success);
      }
      setAuthAttempted(true); // Mark that we've tried to authenticate
    };

    tryAutoAuthenticate();
  }, []); // Run only once on mount

  // Show a loading spinner or null while authentication is being attempted
  if (!authAttempted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Loading application...</p> {/* Or a spinner */}
      </div>
    );
  }

  // If not authenticated after attempt, show the password gate
  if (!isAuthenticated) {
    return (
      <PasswordGate onAuthenticated={() => setIsAuthenticated(true)} />
    );
  }
 
  try {
      return (
       <AuthContext.Provider value={{ isAuthenticated }}>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <div className="min-h-screen bg-background flex flex-col">
              <AppHeader />
              <main className="flex-grow">
                <WouterRouter base={FRONTEND_BASE_PATH}>
                  <AppRoutes />
                </WouterRouter>
              </main>
              <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center space-x-2 mb-4 md:mb-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <path d="m5 8 6 6" />
                        <path d="m4 14 6-6 2-3" />
                        <path d="M2 5h12" />
                        <path d="M7 2h1" />
                        <path d="m22 22-5-5" />
                        <circle cx="16" cy="16" r="6" />
                      </svg>
                      <h2 className="text-xl font-bold text-gray-900">Lang<span className="text-primary">2</span>Lang</h2>
                    </div>
                    
                    <div className="flex space-x-6">
                      <a href="#" className="text-gray-500 hover:text-primary">About</a>
                      <a href="#" className="text-gray-500 hover:text-primary">Help</a>
                      <a href="#" className="text-gray-500 hover:text-primary">Privacy</a>
                      <a href="#" className="text-gray-500 hover:text-primary">Terms</a>
                      <button onClick={logout} className="text-gray-500 hover:text-primary">Logout</button>
                    </div>
                  </div>
                  
                  <div className="mt-6 border-t border-gray-200 pt-6 text-center text-gray-500 text-sm">
                    © {new Date().getFullYear()} Lang2Lang. All rights reserved.
                  </div>
                </div>
              </footer>
            </div>
            <Toaster />
          </LanguageProvider>
        </QueryClientProvider>
       </AuthContext.Provider>
      );
  } catch (error) {
    console.error("An error occurred during App component rendering:", error);
    // You could render a fallback UI here for a production app
    return (
      <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
        <h1>Application Error</h1>
        <p>A critical error occurred. Please try refreshing the page.</p>
        <p>Details: {(error as Error).message}</p>
        <p>Check the console for more information.</p>
      </div>
    );
  }
}

export default App;
