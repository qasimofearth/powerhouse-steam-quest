import React, { useEffect, useRef, useState } from 'react';
import spriteSheetJson from '../assets/animations/ppl_logo/spritesheet.json';
import spriteSheetImage from '../assets/animations/ppl_logo/spritesheet.png';

interface Frame {
  filename: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface LoadingScreenProps {
  progress: number;
}

const getFramesFromJson = (json: any): Frame[] => {
  return Object.entries(json.frames).map(([filename, data]: any) => ({
    filename,
    x: data.frame.x,
    y: data.frame.y,
    w: data.frame.w,
    h: data.frame.h,
  }));
};

const frames = getFramesFromJson(spriteSheetJson);
const frameRate = 42; // ~24 fps

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Preload image
  useEffect(() => {
    const img = new Image();
    img.src = spriteSheetImage;
    img.onload = () => {
      setImageLoaded(true);
    };
  }, []);

  // Start animation once image is loaded
  useEffect(() => {
    if (!imageLoaded) return;

    intervalRef.current = setInterval(() => {
      setFrameIndex((prev) => {
        if (prev < frames.length - 1) {
          return prev + 1;
        } else {
          clearInterval(intervalRef.current!);
          return prev;
        }
      });
    }, frameRate);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [imageLoaded]);

  const currentFrame = frames[frameIndex];

  return (
    <div className="fixed inset-0 bg-background bg-background flex flex-col items-center justify-center z-50">
      <div className="flex-1 flex flex-col justify-center items-center w-[260px]">
        {imageLoaded && <p className="text-[#333333] text-xl font-medium italic self-start">Powered by</p>}
        <div className="mt-1 flex items-center">
          {/* Show animation only when image is loaded */}
          {imageLoaded && (
            <div
              style={{
                width: `${currentFrame.w}px`,
                height: `${currentFrame.h}px`,
                backgroundImage: `url(${spriteSheetImage})`,
                backgroundPosition: `-${currentFrame.x}px -${currentFrame.y}px`,
                backgroundRepeat: 'no-repeat',
              }}
            />
          )}
        </div>
      </div>
      <div className="w-3/5 max-w-screen-md flex flex-col items-center mb-28">
        <div className="text-[#333333] text-xl font-medium">Loading... {Math.round(progress)}%</div>
        <div className="w-full h-4 bg-gray-200 rounded-full mt-3">
          <div
            className="h-full bg-[#3C82F6] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
