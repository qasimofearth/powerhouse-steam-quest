import React from 'react';

interface IconButtonProps {
  onClick?: () => void;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  iconSize?: string;
  ariaLabel?: string;
  onMouseEnter?: () => void;
  disabled?: boolean;
}

const IconButton: React.FC<IconButtonProps> = ({
  onClick,
  icon: Icon = null,
  iconSize = 'w-5 h-5',
  ariaLabel,
  onMouseEnter,
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      role="button"
      aria-label={ariaLabel}
      onMouseEnter={onMouseEnter}
      disabled={disabled}
      className={`
        w-10 h-11
        rounded-md 
        bg-white 
        border-2 border-blue-500 border-solid 
        flex items-center justify-center
        transition-colors duration-200 
        hover:bg-blue-50 focus:border-3
        disabled:opacity-50 disabled:cursor-not-allowed
        disabled:bg-gray-100 disabled:border-gray-300
      `}
    >
      <span className={`${iconSize} inline-flex items-center justify-center`}>
        {Icon && <Icon className="w-full h-full fill-blue-500 disabled:fill-gray-300" />}
      </span>
    </button>
  );
};

export default IconButton;
