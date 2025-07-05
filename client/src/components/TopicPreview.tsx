import { useLocation } from 'wouter';
import { Topic } from '@shared/schema';
import { API_BASE_URL } from '@/config'; // Import API_BASE_URL from your config

interface TopicPreviewProps {
  topic: Topic | null;
  isLoading: boolean;
}

const TopicPreview: React.FC<TopicPreviewProps> = ({ topic, isLoading }) => {
  console.log("Rendering TopicPreview component.");
  const [_, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="w-full md:w-2/3">
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-6"></div>
          <div className="mb-6">
            <div className="h-5 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="flex flex-wrap gap-2">
              <div className="h-8 bg-gray-200 rounded-full w-24"></div>
              <div className="h-8 bg-gray-200 rounded-full w-24"></div>
              <div className="h-8 bg-gray-200 rounded-full w-24"></div>
            </div>
          </div>
          <div className="border-t border-b border-gray-200 py-4 my-4">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <div className="h-10 bg-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="w-full md:w-2/3">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-10">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No topic selected</h3>
            <p className="mt-1 text-gray-500">Please select a topic from the list on the left</p>
          </div>
        </div>
      </div>
    );
  }

  // MODIFIED startLesson function to fetch the actual lesson ID
  const startLesson = async () => {
    if (!topic?.id) {
      console.error("Topic ID is missing for starting a lesson.");
      return;
    }

    try {
      // Step 1: Call the backend to get the next available lesson ID for this topic
      const response = await fetch(`${API_BASE_URL}/api/topics/${topic.id}/next-lesson`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get next lesson from backend.');
      }

      const data = await response.json();
      const lessonId = data.lessonId; // This is the actual Firestore document ID (e.g., 3EkE8QGELIxYQi9Ci9UM)

      if (lessonId) {
        // Step 2: Navigate to the lesson page using the received lessonId
        setLocation(`/lesson/${lessonId}`);
      } else {
        // Handle case where no available lesson is found (e.g., all are 'done' for this topic)
        alert('No available or in-progress lessons for this topic. All done?');
        // You might want to display a toast notification or a more user-friendly message here.
      }
    } catch (error: any) {
      console.error('Error starting lesson:', error);
      alert(`Error starting lesson: ${error.message}`);
    }
  };

  return (
    <div className="w-full md:w-2/3">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{topic.title}</h2>
          <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">{topic.difficulty}</span>
        </div>

        <p className="text-gray-600 mb-6">{topic.description}</p>

        <div className="mb-6">
          <h3 className="text-base font-medium text-gray-900 mb-2">You'll learn:</h3>
          <div className="flex flex-wrap gap-2">
            {topic.tags && topic.tags.map((tag, index) => (
              <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                {tag}
              </span>
            ))}
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">14 essential exchanges</span>
          </div>
        </div>

        <div className="border-t border-b border-gray-200 py-4 my-4">
          <h3 className="text-base font-medium text-gray-900 mb-3">Sample phrases you'll master:</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="material-icons text-primary-600 mr-2 text-sm">check_circle</span>
              <span>"¿Dónde está el banco más cercano?" (Where is the nearest bank?)</span>
            </li>
            <li className="flex items-start">
              <span className="material-icons text-primary-600 mr-2 text-sm">check_circle</span>
              <span>"Gire a la derecha en la próxima calle." (Turn right at the next street.)</span>
            </li>
            <li className="flex items-start">
              <span className="material-icons text-primary-600 mr-2 text-sm">check_circle</span>
              <span>"¿Está lejos la estación de metro?" (Is the metro station far?)</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            onClick={startLesson} // This button calls the async startLesson function
            className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <span className="material-icons mr-1 text-sm">play_arrow</span>
            Start Lesson
          </button>
          <button className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            <span className="material-icons mr-1 text-sm">star_outline</span>
            Save for Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopicPreview;