import React, { memo } from 'react';
import { useSvgIcon } from '../../hooks/useSvgIcon';
import TimeStatus from './TimeStatus';
import { QUEST_ASSET_BASE_URL } from '../../constants/constants';
import { Quest } from '../../types/interfaces';

const QuestCard: React.FC<Quest> = memo(
  ({ id, title, subtitle, isDisabled, figmaLink, scormPackageUrl, demoLink, questTimeStamp }) => {
    const FigmaIcon = useSvgIcon('figma');
    const DownloadIcon = useSvgIcon('download');
    return (
      <div
        key={id}
        className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-[480px]
          ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-blue-100 hover:shadow-md transition-all duration-200'}`}
      >
        {/* Thumbnail Image */}
        <div className="relative">
          {isDisabled ? (
            <div className="w-full h-60 object-cover" />
          ) : (
            <img
              src={`${QUEST_ASSET_BASE_URL}${id}/assets/backgrounds/bg1.webp`}
              alt={`${id} thumbnail`}
              className="w-full h-60 object-cover"
            />
          )}
          <TimeStatus questTimeStamp={questTimeStamp} />
        </div>
        <div className="p-6 flex flex-col h-[220px]">
          {/* Header Row */}
          <div className="flex justify-between items-start mb-3">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            {figmaLink && (
              <a
                href={figmaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full hover:bg-gray-50 text-gray-500 transition-colors"
                title="View Figma Project"
              >
                <FigmaIcon width="18" height="18" stroke="currentColor" strokeWidth="2" />
              </a>
            )}
          </div>
          <p className="text-m text-gray-600 mb-auto">{subtitle}</p>
          <TimeStatus questTimeStamp={questTimeStamp} showDetails />

          {/* Buttons */}
          <div className="flex justify-between items-center pt-4">
            <div className="flex gap-2">
              <a
                href={`${demoLink}?lang=en`}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-4 py-2 rounded-md text-white font-medium bg-blue-500 hover:bg-blue-600 transition-colors text-m
                            ${isDisabled ? 'pointer-events-none' : ''}`}
              >
                Start ►
              </a>
              <a
                href={`${demoLink}?lang=es`}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-4 py-2 rounded-md text-white font-medium bg-blue-500 hover:bg-blue-600 transition-colors text-m
                            ${isDisabled ? 'pointer-events-none' : ''}`}
              >
                Comenzar ►
              </a>
            </div>
            {scormPackageUrl && (
              <a
                href={scormPackageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-4 py-2 rounded-md text-gray-600 text-m font-medium hover:bg-gray-50 border border-gray-200 flex items-center gap-2
                            ${isDisabled ? 'pointer-events-none' : ''}`}
              >
                <DownloadIcon width="14" height="14" stroke="currentColor" strokeWidth="2" />
                <span>SCORM</span>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  },
);

export default QuestCard;
