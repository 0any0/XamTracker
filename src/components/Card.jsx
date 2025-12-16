import React from 'react';
import './Card.css';

const Card = ({
    children,
    glass = false,
    hover = true,
    padding = 'medium',
    className = '',
    onClick,
}) => {
    const classNames = [
        'card-component',
        glass && 'card-glass',
        hover && 'card-hover',
        `card-padding-${padding}`,
        onClick && 'card-clickable',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={classNames} onClick={onClick}>
            {children}
        </div>
    );
};

export default Card;
