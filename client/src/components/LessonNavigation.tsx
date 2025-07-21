// components/LessonNavigation.tsx

import { useLocation } from 'wouter';

interface LessonNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNavigate: (step: number) => void;
  onDone: () => void;
}

const LessonNavigation: React.FC<LessonNavigationProps> = ({
  currentStep,
  totalSteps,
  onNavigate,
  onDone
}) => {
  const [_, setLocation] = useLocation();

  const goBack = () => {
    setLocation('/');
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="flex items-center justify-between mb-6">
      <button 
        className="inline-flex items-center text-gray-600 hover:text-primary"
        onClick={goBack}
      >
        <span className="material-icons mr-1">arrow_back</span>
        Back to Topics
      </button>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-500">Step {currentStep} of {totalSteps}</span>
        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <button
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center shadow-md"
          onClick={onDone}
        >
          Done
          <span className="material-icons ml-1">done_all</span>
        </button>
      </div>
    </div>
  );
};

export default LessonNavigation;
