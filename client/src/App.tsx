import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useState } from "react";
import Home from "@/pages/Home";
import Lesson from "@/pages/Lesson";
import NotFound from "@/pages/not-found";
import AppHeader from "@/components/AppHeader";
import { LanguageContext } from "@/lib/languages";

function Router() {
  const [location] = useLocation();
  console.log("Wouter's current path 250538:", location);


  return (
    <Switch>
      {/* This will match the root path if you just go to /lang2lang-dev_frontend/ */}
      <Route path="/lang2lang-dev_frontend/" component={Home} /> 
      {/* This will match when index.html is explicitly in the URL */}
      <Route path="/lang2lang-dev_frontend/index.html" component={Home} /> 

      {/* Original root route - might still be useful for internal navigation, but will be overshadowed by the more specific ones */}
      <Route path="/" component={Home} /> 

      <Route path="/lesson/:id" component={Lesson} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [currentLanguage, setCurrentLanguage] = useState<string>("es");

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageContext.Provider value={{ currentLanguage, setCurrentLanguage }}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <AppHeader />
          <main className="flex-grow">
            <Router />
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
                </div>
              </div>
              
              <div className="mt-6 border-t border-gray-200 pt-6 text-center text-gray-500 text-sm">
                © {new Date().getFullYear()} Lang2Lang. All rights reserved.
              </div>
            </div>
          </footer>
        </div>
        <Toaster />
      </LanguageContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
