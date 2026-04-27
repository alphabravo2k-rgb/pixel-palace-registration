import React, { useRef, useState } from 'react';

export const Magnetic = ({ children, padding = 30 }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.15, y: middleY * 0.15 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  return React.cloneElement(children, {
    ref,
    onMouseMove: handleMouse,
    onMouseLeave: reset,
    style: {
      ...children.props.style,
      transform: `translate(${position.x}px, ${position.y}px)`,
      transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)'
    }
  });
};
