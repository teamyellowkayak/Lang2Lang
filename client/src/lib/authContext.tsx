// client/src/lib/authContext.tsx

import React, { createContext, useContext } from 'react';

// Define the shape of the context value
interface AuthContextType {
  isAuthenticated: boolean;
  // If you later add functions like `login` or `logout` to the context,
  // you'd add their types here. For now, just isAuthenticated.
}

// Create the context with a default undefined value.
// We'll provide a real value using AuthContext.Provider.
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Optional: A custom hook to use the AuthContext, with a type guard
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // This error will be thrown if useAuth is called outside of an AuthContext.Provider
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};