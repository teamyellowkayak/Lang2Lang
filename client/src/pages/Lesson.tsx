// Lesson.tsx

import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useLesson } from '@/lib/lessonData';
import LessonNavigation from '@/components/LessonNavigation';
import LessonContent from '@/components/LessonContent';
import { Lesson as LessonType } from '@shared/schema';
import { API_BASE_URL } from '../config';

const Lesson = () => {
  const [_, params] = useRoute('/lesson/:id');
  const [__, setLocation] = useLocation();
  const lessonId = params?.id ? params.id : 0;
  
  const { data: lesson, isLoading, error } = useLesson(lessonId);
  const [currentExchangeIndex, setCurrentExchangeIndex] = useState(0);
  
  // Handle navigation through exchanges
  const handleComplete = () => {
    if (!lesson || typeof lesson.exchanges !== 'object') return;
    
    const exchanges = Array.isArray(lesson.exchanges) ? lesson.exchanges : [];
    
    if (currentExchangeIndex < exchanges.length - 1) {
      // Move to next exchange
      setCurrentExchangeIndex(currentExchangeIndex + 1);
    } else {
      // End of lesson, could navigate elsewhere
      // For now, just go back to the first exchange
      setCurrentExchangeIndex(0);
    }
  };

  const handlePrevious = () => {
    if (currentExchangeIndex > 0) {
      setCurrentExchangeIndex(currentExchangeIndex - 1);
    }
    // The "Previous" button in LessonContent is disabled when currentExchangeIndex === 0
  };
  
  const handleNavigation = (step: number) => {
    setCurrentExchangeIndex(step - 1);
  };

  const handleLessonCompletion = async () => {
    console.log(`Frontend: Attempting to mark lesson ${lessonId} as done`);
    try {
      const response = await fetch(`${API_BASE_URL}/api/lessons/${lessonId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          // If your backend requires authentication (e.g., a Bearer token), add it here:
          // 'Authorization': `Bearer ${yourAuthToken}`
        },
        // No request body is strictly necessary for this endpoint,
        // as the ID in the URL and the PATCH method imply the action.
        // body: JSON.stringify({ status: 'done' }) // Only if your backend specifically expects a body
      });

      if (!response.ok) {
        const errorData = await response.json(); // Attempt to parse error message from response
        console.error(`Frontend: API call failed with status ${response.status}:`, errorData.message || 'Unknown error');
        throw new Error(errorData.message || `Failed to mark lesson as done (Status: ${response.status})`);
      }

      console.log(`Frontend: Lesson ${lessonId} successfully marked as done on the backend.`);
    } catch (error: any) {
      console.error('Frontend: Error during API call to mark lesson as done:', error.message);
    }
    
    // Navigate back to the topics page after the attempt (successful or not)
    setLocation('/'); 
  };

  // If there's an error loading the lesson, show an error message
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-700">Failed to load lesson: {error.message}</p>
          <button 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
            onClick={() => setLocation('/')}
          >
            Return to Topics
          </button>
        </div>
      </div>
    );
  }
  
  // If lesson is still loading, show a loading state
  if (isLoading || !lesson) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-gray-200 rounded w-24"></div>
            <div className="flex items-center space-x-1">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="w-24 h-2 bg-gray-200 rounded-full"></div>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-2/3">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                <div className="h-24 bg-gray-200 rounded mb-6"></div>
                
                <div className="space-y-6 mb-8">
                  <div className="flex">
                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                    <div className="ml-4 w-full">
                      <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded w-full mb-1"></div>
                      <div className="h-6 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-1/3">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const exchanges = Array.isArray(lesson.exchanges) 
    ? lesson.exchanges 
    : typeof lesson.exchanges === 'string'
      ? JSON.parse(lesson.exchanges)
      : [];
  
  const totalSteps = exchanges.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LessonNavigation 
          currentStep={currentExchangeIndex + 1}
          totalSteps={totalSteps}
          onNavigate={handleNavigation}
          onDone={handleLessonCompletion}
        />
      
      <LessonContent 
        lesson={lesson as LessonType}
        currentExchangeIndex={currentExchangeIndex}
        onPrevious={handlePrevious}
        onComplete={handleComplete}
      />
    </div>
  );
};

export default Lesson;
