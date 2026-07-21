import { useState, useEffect } from 'react';
import type { Cell } from '../../../shared/types';

interface CellProps {
    cell: Cell;
    onClick: () => void;
    isCurrentPlayerCell: boolean;
    currentPlayerColor: string | null;
    ownerColor: string | null;
    disabled: boolean;
    isExploding?: boolean;
}

export default function CellComponent({
    cell,
    onClick,
    isCurrentPlayerCell,
    currentPlayerColor,
    ownerColor,
    disabled,
    isExploding = false,
}: CellProps) {
    const [particles, setParticles] = useState<Array<{ id: number; tx: number; ty: number }>>([]);
    const [shake, setShake] = useState(false);
    const canPlace = (!disabled) && (cell.ownerId === null || isCurrentPlayerCell);
    const isCritical = cell.orbCount >= cell.criticalMass - 1 && cell.ownerId !== null && !isExploding;

    const handleClick = () => {
        if (disabled) return;
        if (!canPlace) {
            setShake(true);
            setTimeout(() => setShake(false), 400);
            return;
        }
        onClick();
    };

    // Create particle burst effect when exploding
    useEffect(() => {
        if (isExploding) {
            const newParticles: Array<{ id: number; tx: number; ty: number }> = [];
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const distance = 50 + Math.random() * 30;
                newParticles.push({
                    id: Date.now() + i,
                    tx: Math.cos(angle) * distance,
                    ty: Math.sin(angle) * distance,
                });
            }
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setParticles(newParticles);

            // Clear particles after animation
            const timer = setTimeout(() => setParticles([]), 600);
            return () => clearTimeout(timer);
        }
    }, [isExploding]);

    // Handle hex to rgb for rgba conversion
    const hexToRgba = (hex: string, alpha: number) => {
        if (!hex || !hex.startsWith('#')) return 'rgba(255, 255, 255, 0.8)';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const bgColor = ownerColor 
        ? hexToRgba(ownerColor, 0.15) 
        : 'rgba(255, 255, 255, 0.8)';

    const borderColor = ownerColor 
        ? hexToRgba(ownerColor, 0.4) 
        : 'rgba(226, 232, 240, 1)'; // slate-200

    const textColor = ownerColor || 'transparent';

    return (
        <button
            onClick={handleClick}
            aria-disabled={!canPlace}
            className={`cell w-full aspect-square rounded-[25%] md:rounded-2xl border transition-all duration-300 overflow-visible relative
                ${isCritical ? 'cell-critical' : ''} 
                ${isExploding ? 'cell-exploding z-20' : ''} 
                ${shake ? 'cell-shake' : ''}
                ${!canPlace ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 hover:z-10'}`
            }
            style={{
                backgroundColor: bgColor,
                borderColor: borderColor,
                color: textColor,
                boxShadow: ownerColor ? `0 4px 15px -3px ${hexToRgba(ownerColor, 0.3)}` : '0 2px 8px -2px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
                if (canPlace) {
                    const hoverColor = ownerColor || currentPlayerColor || '#cbd5e1';
                    e.currentTarget.style.backgroundColor = hexToRgba(hoverColor, 0.25);
                    e.currentTarget.style.borderColor = hexToRgba(hoverColor, 0.8);
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = bgColor;
                e.currentTarget.style.borderColor = borderColor;
            }}
        >
            {/* Explosion particles */}
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="explosion-particle z-30"
                    style={{
                        '--tx': `${particle.tx}px`,
                        '--ty': `${particle.ty}px`,
                        background: ownerColor || 'white',
                    } as React.CSSProperties}
                />
            ))}

            {cell.orbCount > 0 && (
                <div className="absolute inset-0 flex items-center justify-center p-[10%]">
                    <div className="w-full h-full relative">
                        {Array.from({ length: Math.min(cell.orbCount, 4) }).map((_, i) => {
                            // Orb size calculation
                            let sizeClass = 'w-[40%] h-[40%]';
                            if (cell.orbCount === 1) {
                                sizeClass = 'w-[65%] h-[65%]';
                            } else if (cell.orbCount === 2) {
                                sizeClass = 'w-[50%] h-[50%]';
                            }
                            
                            // Positioning
                            let posStyle: React.CSSProperties = {};
                            const baseTranslate = 'translate(-50%, -50%)';

                            if (cell.orbCount === 1) {
                                posStyle = { top: '50%', left: '50%', transform: baseTranslate };
                            } else if (cell.orbCount === 2) {
                                if (i === 0) posStyle = { top: '35%', left: '35%', transform: baseTranslate };
                                if (i === 1) posStyle = { top: '65%', left: '65%', transform: baseTranslate };
                            } else if (cell.orbCount === 3) {
                                if (i === 0) posStyle = { top: '30%', left: '50%', transform: baseTranslate };
                                if (i === 1) posStyle = { top: '70%', left: '30%', transform: baseTranslate };
                                if (i === 2) posStyle = { top: '70%', left: '70%', transform: baseTranslate };
                            } else {
                                if (i === 0) posStyle = { top: '30%', left: '30%', transform: baseTranslate };
                                if (i === 1) posStyle = { top: '30%', left: '70%', transform: baseTranslate };
                                if (i === 2) posStyle = { top: '70%', left: '30%', transform: baseTranslate };
                                if (i === 3) posStyle = { top: '70%', left: '70%', transform: baseTranslate };
                            }

                            return (
                                <div
                                    key={i}
                                    className={`orb absolute rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.3)] ${sizeClass} transition-all duration-300`}
                                    style={{
                                        ...posStyle,
                                        backgroundColor: ownerColor || '#fff',
                                        backgroundImage: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9) 0%, ${ownerColor || '#fff'} 40%, rgba(0,0,0,0.1) 100%)`
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </button>
    );
}
