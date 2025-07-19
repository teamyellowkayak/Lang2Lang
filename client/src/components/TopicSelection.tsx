import { useState } from 'react';
import type { Topic } from '@shared/schema';
import type { TopicCategory } from '@/lib/topics';

interface TopicSelectionProps {
  categories: TopicCategory[];
  onTopicSelect: (topic: Topic) => void;
  selectedTopic: Topic | null;
  isLoading: boolean;
}

const TopicSelection: React.FC<TopicSelectionProps> = ({ 
  categories,
  onTopicSelect,
  selectedTopic,
  isLoading
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredCategories = categories.map(category => ({
    ...category,
    topics: category.topics.filter(topic => 
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (topic.tags && topic.tags.some(tag => 
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    )
  })).filter(category => category.topics.length > 0);

  return (
    <div className="w-full md:w-1/3">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose a Topic</h2>
        
        {/* Search Input */}
        <div className="relative mb-4">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="material-icons text-gray-400 text-sm">search</span>
          </span>
          <input 
            type="text" 
            placeholder="Search topics or type your own"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="py-10 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-500">Loading topics...</p>
          </div>
        )}
        
        {/* Topic Categories */}
        {!isLoading && filteredCategories.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-gray-500">No topics found matching "{searchQuery}"</p>
          </div>
        )}
        
        {!isLoading && filteredCategories.length > 0 && (
          <div className="space-y-4">
            {filteredCategories.map((category) => (
              <div key={category.name}>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">{category.name}</h3>
                <ul className="space-y-1">
                  {category.topics.map((topic) => (
                    <li key={topic.id}>
                      <button 
                        className={`w-full text-left py-2 px-3 rounded-md ${
                          selectedTopic && selectedTopic.id === topic.id
                            ? 'bg-primary-50 text-primary-700'
                            : 'hover:bg-primary-50 hover:text-primary-700 text-gray-700'
                        } font-medium flex items-center justify-between transition-colors`}
                        onClick={() => onTopicSelect(topic)}
                      >
                        <span>{topic.title}</span>
                        <span className={`material-icons text-sm ${
                          selectedTopic && selectedTopic.id === topic.id
                            ? 'text-primary-600'
                            : 'text-gray-400'
                        }`}>chevron_right</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicSelection;
