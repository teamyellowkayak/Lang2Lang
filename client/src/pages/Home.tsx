import { useState } from 'react';
import { useLanguage } from '@/lib/languages';
import { useTopics, getCategorizedTopics } from '@/lib/topics';
import TopicSelection from '@/components/TopicSelection';
import TopicPreview from '@/components/TopicPreview';
import { Topic } from '@shared/schema';

const Home = () => {
  const { currentLanguage } = useLanguage();
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  
  const { data: topics, isLoading } = useTopics(currentLanguage);
  
  const categorizedTopics = topics 
    ? getCategorizedTopics(topics)
    : [];
  
  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <TopicSelection 
          categories={categorizedTopics}
          onTopicSelect={handleTopicSelect}
          selectedTopic={selectedTopic}
          isLoading={isLoading}
        />
        
        <TopicPreview 
          topic={selectedTopic}
          isLoading={isLoading && !selectedTopic}
        />
      </div>
    </div>
  );
};

export default Home;
