import React from 'react';

interface POSGridItemProps {
  id: string;
  name: string;
  icon?: string;
  price?: number;
  color?: string;
  onClick: (id: string, name: string, price?: number) => void;
  buttonSize?: 'small' | 'medium' | 'large';
}

const POSGridItem: React.FC<POSGridItemProps> = ({
  id,
  name,
  icon,
  price,
  color,
  onClick,
  buttonSize = 'medium',
}) => {
  const sizeClasses = {
    small: 'p-2 text-sm h-20',
    medium: 'p-3 text-base h-24',
    large: 'p-4 text-lg h-32',
  };

  return (
    <button
      onClick={() => onClick(id, name, price)}
      className={`
        ${sizeClasses[buttonSize]}
        rounded-lg font-semibold transition-all duration-200
        hover:shadow-lg hover:scale-105 active:scale-95
        flex flex-col items-center justify-center gap-2
        text-white border-2 border-opacity-50
        ${color || 'bg-primary'}
      `}
      style={{ backgroundColor: color || '#8B4513' }}
    >
      {icon && <span className="text-2xl">{icon}</span>}
      <span className="line-clamp-2 text-center font-bold">{name}</span>
      {price && (
        <span className="text-xs font-semibold opacity-90">${price.toFixed(2)}</span>
      )}
    </button>
  );
};

export default POSGridItem;
