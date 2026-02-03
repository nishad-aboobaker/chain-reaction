import { useState, useEffect } from 'react';
import type { Cell } from '../../../shared/types';

interface CellProps {
    cell: Cell;
    onClick: () => void;
    isCurrentPlayerCell: boolean;
    currentPlayerColor: string;
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
    const canPlace = (!disabled) && (cell.ownerId === null || isCurrentPlayerCell);
    const isCritical = cell.orbCount >= cell.criticalMass - 1 && cell.ownerId !== null && !isExploding;

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
    const [showTrail, setShowTrail] = useState(false);
    useEffect(() => {
        if (isAdding) {
            setShowTrail(true);
            const timer = setTimeout(() => setShowTrail(false), 400);
            return () => clearTimeout(timer);
        }
    }, [isAdding]);

    return (
        <button
            onClick={onClick}
            disabled={!canPlace}
            className={`cell ${isCritical ? 'cell-critical' : ''} ${isExploding ? 'cell-exploding' : ''}`}
            style={{
                backgroundColor: ownerColor ? ownerColor : 'rgba(255, 255, 255, 0.05)',
                cursor: canPlace ? 'pointer' : 'not-allowed',
                opacity: canPlace ? 1 : 0.5,
                position: 'relative',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.5rem',
                aspectRatio: '1',
                transition: 'all 0.2s',
                overflow: 'visible',
            }}
            onMouseEnter={(e) => {
                if (canPlace) {
                    e.currentTarget.style.backgroundColor = ownerColor || currentPlayerColor;
                    e.currentTarget.style.transform = 'scale(1.05)';
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = ownerColor || 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.transform = 'scale(1)';
            }}
        >
            {/* Explosion particles */}
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="explosion-particle"
                    style={{
                        '--tx': `${particle.tx}px`,
                        '--ty': `${particle.ty}px`,
                        background: ownerColor || 'white',
                    } as React.CSSProperties}
                />
            ))}

            {/* Orb addition trail effect */}
            {showTrail && (
                <div
                    className="orb-trail"
                    style={{
                        background: `radial-gradient(circle, ${ownerColor || 'rgba(255, 255, 255, 0.5)'} 0%, transparent 70%)`,
                    }}
                />
            )}

            {cell.orbCount > 0 && (
                <div
                    className={`orbs-container ${isAdding ? 'orb-adding' : ''}`}
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.125rem',
                        flexWrap: 'wrap',
                        padding: '0.25rem',
                        width: '100%',
                        height: '100%',
                    }}
                >
                    {Array.from({ length: Math.min(cell.orbCount, 4) }).map((_, i) => (
                        <div
                            key={i}
                            className="orb"
                            style={{
                                backgroundColor: 'white',
                                width: cell.orbCount === 1 ? '1.5rem' : '1rem',
                                height: cell.orbCount === 1 ? '1.5rem' : '1rem',
                                borderRadius: '50%',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                            }}
                        />
                    ))}
                    {cell.orbCount > 4 && (
                        <div
                            className="orb-count"
                            style={{
                                position: 'absolute',
                                top: '0.25rem',
                                right: '0.25rem',
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                color: 'white',
                                fontSize: '0.75rem',
                                padding: '0.125rem 0.375rem',
                                borderRadius: '0.25rem',
                                fontWeight: 'bold',
                            }}
                        >
                            {cell.orbCount}
                        </div>
                    )}
                </div>
            )}
        </button>
    );
}
