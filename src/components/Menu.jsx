import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import './Menu.css';

const Menu = ({ items, iconSize = 20, triggerClassName = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleItemClick = (onClick) => {
        onClick();
        setIsOpen(false);
    };

    return (
        <div className="menu-container" ref={menuRef}>
            <button
                className={`menu-trigger ${triggerClassName}`}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
            >
                <MoreVertical size={iconSize} />
            </button>

            {isOpen && (
                <div className="menu-dropdown">
                    {items.map((item, index) => (
                        <button
                            key={index}
                            className={`menu-item ${item.variant || ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleItemClick(item.onClick);
                            }}
                        >
                            {item.icon && <span className="menu-item-icon">{item.icon}</span>}
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Menu;
