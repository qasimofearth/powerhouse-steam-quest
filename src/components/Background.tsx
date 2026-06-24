import React, { useEffect, useRef } from 'react';
import { BackgroundProps, ZoomConfig } from '../types/interfaces';
import { useBlurEffect } from '../hooks/useBlurEffect';
import { getAssetPath } from '../utils/assetPath';
import useScreenSize from '../hooks/useScreenSize';
import { isSafari } from '../utils/browserDetection';
import { useTranslations } from '../hooks/useTranslations';

const Background: React.FC<BackgroundProps> = ({
  alt = 'Background',
  blur = 0,
  zoom = 1,
  backgroundImage,
  pan,
  waitDelay = 0,
  initialZoom,
}) => {
  const getZoomConfig = (zoom: number | ZoomConfig): ZoomConfig => {
    return typeof zoom === 'number' ? { scale: zoom } : zoom;
  };
  const { isZoomed200 } = useScreenSize();

  const { blurFilter, currentBlurAmount } = useBlurEffect(blur, waitDelay);
  const zoomConfig = getZoomConfig(zoom);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { t } = useTranslations();

  useEffect(() => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const translateX = -scrollPosition * 0.2 * 0.1;
      image.style.transform = `translateX(${translateX}px) scale(${zoomConfig.scale})`;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [zoomConfig.scale]);

  useEffect(() => {
    if (!imageRef.current) return;

    const initialScale = initialZoom || zoomConfig.scale;
    if (!isZoomed200) {
      imageRef.current.style.transform = `translateX(${-(pan ?? 0)}px) scale(${initialScale})`;
    }

    if (initialZoom && waitDelay) {
      setTimeout(() => {
        if (imageRef.current) {
          imageRef.current.style.transform = `translateX(${-(pan ?? 0)}px) scale(${zoomConfig.scale})`;
        }
      }, waitDelay);
    }
  }, [zoomConfig.scale, pan, waitDelay, initialZoom, isZoomed200]);

  return (
    <>
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          filter: blurFilter,
          pointerEvents: 'none',
          transition: 'filter 0.3s ease-in-out',
        }}
        ref={containerRef}
      >
        <img
          ref={imageRef}
          src={getAssetPath(backgroundImage)}
          alt={t(alt)}
          className="h-full object-cover"
          style={{
            minWidth: '100%',
            maxWidth: '1000%',
            objectPosition: 'left center',
            transition: `transform ${zoomConfig.duration || 0.3}s ${zoomConfig.timingFunction || 'ease-out'}`,
          }}
        />
      </div>
      {isSafari() && (
        <div
          style={{
            position: 'absolute',
            WebkitBackdropFilter: `blur(${currentBlurAmount}px)`,
            backdropFilter: `blur(${currentBlurAmount}px)`,
            transition: 'WebkitBackdropFilter 0.3s ease-in-out, backdrop-filter 0.3s ease-in-out',
            height: '100%',
            width: '100vw',
            top: 0,
            left: 0,
          }}
        ></div>
      )}
    </>
  );
};

export default Background;
