import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import './Timer.css';

const Timer = ({ startTime, paused = false, size = 'large' }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (paused) return;

        const interval = setInterval(() => {
            setElapsed(Date.now() - startTime);
        }, 100); // Update every 100ms for smooth display

        return () => clearInterval(interval);
    }, [startTime, paused]);

    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`timer timer-${size}`}>
            <Clock className="timer-icon" />
            <span className="timer-display">{formatTime(elapsed)}</span>
        </div>
    );
};

export default Timer;
