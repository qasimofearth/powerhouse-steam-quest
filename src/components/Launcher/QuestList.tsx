import React, { useState, useEffect } from 'react';
import QuestCard from './QuestCard';
import { Quest, QuestLastUpdatedRecord } from '../../types/interfaces';
import { useSvgIcon } from '../../hooks/useSvgIcon';
import { COMMON_DRIVE_LINK, LAST_UPDATED_FILENAME } from '../../constants/constants';

const sortByActiveStatus = (quests: Quest[]) => {
  return [...quests].sort((a, b) => {
    return Number(a.isDisabled) - Number(b.isDisabled);
  });
};

const QuestList: React.FC = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questLastUpdated, setQuestLastUpdated] = useState<QuestLastUpdatedRecord>({});
  const [selectedSection, setSelectedSection] = useState('Algebra1');
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ResourcesIcon = useSvgIcon('resources');

  const sections = ['Algebra1', 'Algebra2', 'Geometry', 'Math 2'];

  useEffect(() => {
    const fetchQuests = async () => {
      setLoading(true);
      setError(null);
      try {
        const module = await import('../../GAME_DATA/launcher/quests.json');
        if (!import.meta.env.DEV) {
          try {
            const currentDomain = window.location.hostname;
            const lastUpdatedModule = await fetch(`https://${currentDomain}/${LAST_UPDATED_FILENAME}`);
            setQuestLastUpdated(await lastUpdatedModule.json());
          } catch (fetchError) {
            console.error('Error fetching from dynamic domain, using fallback:', fetchError);
            // fallback
            const { DOMAIN } = await import('../../constants/constants');
            const fallbackLastUpdatedModule = await fetch(`https://${DOMAIN}/${LAST_UPDATED_FILENAME}`);
            setQuestLastUpdated(await fallbackLastUpdatedModule.json());
          }
        }
        // Uncomment the following lines if you want to use a local last-updated.json file in development
        // else {
        //   const lastUpdatedModule = await import('../../../dist/last-updated.json');
        //   setQuestLastUpdated(lastUpdatedModule.default);
        // }
        setQuests(module.default);
      } catch (error) {
        setError('Failed to load quests. Please try again later.');
        console.error('Error loading quests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuests();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading quests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const sortedQuests = sortByActiveStatus(quests);

  const filteredQuests = sortedQuests.filter((quest) => quest.section === selectedSection);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <label htmlFor="program-select" className="text-gray-700 font-medium">
            Program
          </label>
          <div className="flex space-x-2">
            {sections.map((section) => (
              <button
                key={section}
                onClick={() => setSelectedSection(section)}
                className={`px-2 py-2 rounded-lg border transition-all
        ${
          selectedSection === section
            ? 'bg-blue-500 text-white border-blue-500'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                {section}
              </button>
            ))}
          </div>
        </div>

        <a
          href={COMMON_DRIVE_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 rounded-lg text-gray-700 bg-gray-50 
            hover:bg-gray-100 transition-colors border border-gray-200 gap-2"
        >
          <ResourcesIcon width="16" height="16" stroke="currentColor" strokeWidth="2" />
          <span>Resources</span>
        </a>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredQuests.length > 0 ? (
              filteredQuests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  {...quest}
                  questTimeStamp={{
                    ...questLastUpdated[quest.id],
                    latestCommitHash: questLastUpdated[quest.id]?.latestCommitHash || undefined,
                  }}
                />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-16">
                <div className="text-gray-500 text-center">
                  <p className="text-lg font-medium mb-2">No quests available</p>
                  <p className="text-m">Please select a different section or check back later.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestList;
