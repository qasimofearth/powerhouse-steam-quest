import React from 'react';
import { TimeStatusProps } from '../../types/interfaces';

const TIME_UNITS = {
  SECONDS_IN_MINUTE: 60,
  MINUTES_IN_HOUR: 60,
  HOURS_IN_DAY: 24,
  DAYS_IN_MONTH: 30,
  MILLISECONDS_IN_SECOND: 1000,
};

const STATUS_THRESHOLDS = {
  NEW: 48,
  UPDATED: 48,
};

function getLocalNow(): Date {
  return new Date();
}

function isValidDate(date: Date): boolean {
  return !isNaN(date.getTime());
}

function formatTimeUnit(value: number, unit: string): string {
  return `${value} ${unit}${value !== 1 ? 's' : ''} ago`;
}

// Converts a timestamp to a human-readable "time ago" string
function timeAgo(lastUpdated: string): string | undefined {
  if (!lastUpdated) return undefined;

  const updatedTime = new Date(lastUpdated);
  const now = getLocalNow();

  if (!isValidDate(updatedTime)) return undefined;

  const diffInSeconds = Math.floor((now.getTime() - updatedTime.getTime()) / TIME_UNITS.MILLISECONDS_IN_SECOND);

  // Future dates or very recent updates
  if (diffInSeconds < 0 || diffInSeconds < TIME_UNITS.SECONDS_IN_MINUTE) {
    return 'just now';
  }

  // Minutes
  const minutes = Math.floor(diffInSeconds / TIME_UNITS.SECONDS_IN_MINUTE);
  if (minutes < TIME_UNITS.MINUTES_IN_HOUR) {
    return formatTimeUnit(minutes, 'minute');
  }

  // Hours
  const hours = Math.floor(minutes / TIME_UNITS.MINUTES_IN_HOUR);
  if (hours < TIME_UNITS.HOURS_IN_DAY) {
    return formatTimeUnit(hours, 'hour');
  }

  // Days
  const days = Math.floor(hours / TIME_UNITS.HOURS_IN_DAY);
  if (days < TIME_UNITS.DAYS_IN_MONTH) {
    return formatTimeUnit(days, 'day');
  }

  // Months
  const months = Math.floor(days / TIME_UNITS.DAYS_IN_MONTH);
  return formatTimeUnit(months, 'month');
}

// Calculates hours difference between two dates
function getHoursDifference(fromDate: Date, toDate: Date): number {
  return (
    (toDate.getTime() - fromDate.getTime()) /
    (TIME_UNITS.MILLISECONDS_IN_SECOND * TIME_UNITS.SECONDS_IN_MINUTE * TIME_UNITS.MINUTES_IN_HOUR)
  );
}

// Determines if a quest is new or recently updated
function getQuestStatus(createdAt: string, lastUpdated: string): string | undefined {
  if (!createdAt || !lastUpdated) return undefined;

  const createdTime = new Date(createdAt);
  const updatedTime = new Date(lastUpdated);
  const now = getLocalNow();

  if (!isValidDate(createdTime) || !isValidDate(updatedTime)) {
    return undefined;
  }

  // Check if quest is new
  const hoursSinceCreation = getHoursDifference(createdTime, now);
  if (hoursSinceCreation <= STATUS_THRESHOLDS.NEW) {
    return 'New';
  }

  // Check if quest was recently updated
  const hoursSinceUpdate = getHoursDifference(updatedTime, now);
  if (hoursSinceUpdate <= STATUS_THRESHOLDS.UPDATED) {
    return 'Updated';
  }

  return undefined;
}

const TimeStatus: React.FC<TimeStatusProps> = ({ questTimeStamp, showDetails }) => {
  const createdAt = questTimeStamp?.createdAt || '';
  const updatedAt = questTimeStamp?.updatedAt || '';
  const commitHash = questTimeStamp?.latestCommitHash?.slice(0, 7);

  const tag = getQuestStatus(createdAt, updatedAt);
  const lastUpdatedText = timeAgo(updatedAt);

  if (showDetails) {
    return (
      <div className="flex justify-between items-center pt-4">
        <p className="text-sm text-gray-600 mb-auto">Last Updated: {lastUpdatedText}</p>
        <p className="text-sm text-gray-600 mb-auto flex items-center space-x-2">
          <span className="text-gray-500">Commit:</span>
          <code className="font-mono font-semibold bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md">
            {commitHash}
          </code>
        </p>
      </div>
    );
  }

  if (!tag) return null;
  return (
    <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
      {tag}
    </span>
  );
};

export default TimeStatus;
