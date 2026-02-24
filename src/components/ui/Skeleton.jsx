export const Skeleton = ({ className = '' }) => {
  return (
    <div 
      className={`animate-pulse-fast bg-tactical-active rounded ${className}`} 
    />
  );
};
