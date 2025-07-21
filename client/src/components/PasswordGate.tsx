// client/src/components/PasswordGate.tsx

import React, { useState } from 'react';
import { authenticateApp } from '@/utils/auth'; // Adjust path based on your structure

interface PasswordGateProps {
  onAuthenticated: () => void; // Callback to notify parent on success
}

const PasswordGate: React.FC<PasswordGateProps> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setMessage('Please enter a password.');
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setMessage('Checking password...');
    setIsError(false);

    const success = await authenticateApp(password);
    setIsLoading(false);

    if (success) {
      setMessage('Access granted!');
      setIsError(false);
      onAuthenticated(); // Notify parent (App.tsx)
    } else {
      setMessage('Incorrect password. Please try again.');
      setIsError(true);
      setPassword(''); // Clear password field on error
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center bg-background">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Enter Access Password</h1>
      <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4">
        <input
          type="password"
          id="access-password-input"
          placeholder="Enter password"
          className="px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-lg w-72"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          autoComplete="off" // Prevent browser password saving for this temporary gate
        />
        <button
          type="submit"
          id="access-button"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-semibold text-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Accessing...' : 'Access App'}
        </button>
      </form>
      {message && (
        <div className={`mt-4 text-lg ${isError ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default PasswordGate;