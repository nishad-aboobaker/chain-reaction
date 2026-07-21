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
    isAdding?: boolean;
}

export default function CellComponent({
    cell,
    onClick,
    isCurrentPlayerCell,
    currentPlayerColor,
    ownerColor,
    disabled,
    isExploding = false,
    isAdding = false,
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
            setParticles(newParticles);

            // Clear particles after animation
            const timer = setTimeout(() => setParticles([]), 600);
            return () => clearTimeout(timer);
        }
    }, [isExploding]);

    // Add trail effect when orbs added
    useEffect(() => {
        if (isAdding) {
            const timer = setTimeout(() => {}, 400);
            return () => clearTimeout(timer);
        }
    }, [isAdding]);

    // Handle hex to rgb for rgba conversion
    const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const bgColor = ownerColor 
        ? hexToRgba(ownerColor, 0.15) 
        : 'rgba(255, 255, 255, 0.6)';

    const borderColor = ownerColor 
        ? hexToRgba(ownerColor, 0.4) 
        : 'rgba(226, 232, 240, 1)'; // slate-200

    return (
        <button
            onClick={handleClick}
            aria-disabled={!canPlace}
            className={`cell relative w-full aspect-square rounded-xl md:rounded-2xl border transition-all duration-300 overflow-visible
                ${isCritical ? 'cell-critical' : ''} 
                ${isExploding ? 'cell-exploding z-20' : ''} 
                ${shake ? 'cell-shake' : ''}
                ${!canPlace ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 hover:z-10'}`
            }
            style={{
                backgroundColor: bgColor,
                borderColor: borderColor,
                boxShadow: ownerColor ? `0 4px 20px -2px ${hexToRgba(ownerColor, 0.2)}` : '0 2px 10px -2px rgba(0,0,0,0.05)'
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
                <div
                    className={`absolute inset-0 flex flex-wrap items-center justify-center gap-[2px] md:gap-1 p-1 md:p-2 ${isAdding ? 'orb-adding' : ''}`}
                >
                    {Array.from({ length: Math.min(cell.orbCount, 4) }).map((_, i) => {
                        // Orb size calculation
                        let sizeClass = 'w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5';
                        if (cell.orbCount === 1) {
                            sizeClass = 'w-5 h-5 md:w-7 md:h-7 lg:w-8 lg:h-8';
                        } else if (cell.orbCount === 2) {
                            sizeClass = 'w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6';
                        }

                        return (
                            <div
                                key={i}
                                className={`orb rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.25)] ${sizeClass} transition-all duration-300`}
                                style={{
                                    backgroundColor: ownerColor || '#fff',
                                    backgroundImage: `radial-gradient(circle at 30% 30%, white 0%, ${ownerColor || '#fff'} 70%)`
                                }}
                            />
                        );
                    })}
                </div>
            )}
        </button>
    );
}
