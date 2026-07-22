import type { Cell } from '../../../shared/types';

interface CellProps {
    cell: Cell;
    onClick: () => void;
    isCurrentPlayerCell: boolean;
    currentPlayerColor: string | null;
    ownerColor: string | null;
    disabled: boolean;
}

export default function CellComponent({
    cell,
    onClick,
    isCurrentPlayerCell,
    currentPlayerColor,
    ownerColor,
    disabled,
}: CellProps) {
    const canPlace = (!disabled) && (cell.ownerId === null || isCurrentPlayerCell);
    const isCritical = cell.orbCount >= cell.criticalMass - 1 && cell.ownerId !== null && !cell.symbol;

    const handleClick = () => {
        if (disabled || !canPlace) return;
        onClick();
    };

    // Helper to convert hex to rgba
    const hexToRgba = (hex: string, alpha: number) => {
        if (!hex || !hex.startsWith('#')) return 'rgba(255, 255, 255, 0.8)';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const bgColor = ownerColor 
        ? hexToRgba(ownerColor, 0.15) 
        : 'rgba(255, 255, 255, 0.85)';

    const borderColor = ownerColor 
        ? hexToRgba(ownerColor, 0.5) 
        : 'rgba(226, 232, 240, 1)';

    return (
        <button
            onClick={handleClick}
            aria-disabled={!canPlace}
            className={`w-full aspect-square rounded-xl sm:rounded-2xl border transition-all duration-150 relative flex items-center justify-center select-none
                ${isCritical ? 'cell-critical' : ''} 
                ${!canPlace ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:shadow-md hover:scale-[1.02]'}`
            }
            style={{
                backgroundColor: bgColor,
                borderColor: borderColor,
                boxShadow: ownerColor ? `0 2px 8px -2px ${hexToRgba(ownerColor, 0.3)}` : '0 1px 4px rgba(0,0,0,0.04)'
            }}
            onMouseEnter={(e) => {
                if (canPlace) {
                    const hoverColor = ownerColor || currentPlayerColor || '#cbd5e1';
                    e.currentTarget.style.backgroundColor = hexToRgba(hoverColor, 0.25);
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = bgColor;
            }}
        >
            {/* Render XOX Symbol */}
            {cell.symbol ? (
                <div 
                    className="font-black text-3xl sm:text-5xl md:text-6xl flex items-center justify-center transform transition-transform scale-100 animate-bounce-in"
                    style={{
                        color: ownerColor || '#3b82f6',
                        textShadow: ownerColor ? `0 2px 12px ${hexToRgba(ownerColor, 0.4)}` : 'none'
                    }}
                >
                    {cell.symbol}
                </div>
            ) : cell.orbCount > 0 && (
                /* Render Orbs for Chain Reaction */
                <div className="absolute inset-0 flex items-center justify-center p-[10%] pointer-events-none">
                    <div className="w-full h-full relative">
                        {Array.from({ length: Math.min(cell.orbCount, 4) }).map((_, i) => {
                            let sizeClass = 'w-[40%] h-[40%]';
                            if (cell.orbCount === 1) {
                                sizeClass = 'w-[65%] h-[65%]';
                            } else if (cell.orbCount === 2) {
                                sizeClass = 'w-[50%] h-[50%]';
                            }
                            
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
                                    className={`absolute rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.25)] ${sizeClass}`}
                                    style={{
                                        ...posStyle,
                                        backgroundColor: ownerColor || '#fff',
                                        backgroundImage: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9) 0%, ${ownerColor || '#fff'} 40%, rgba(0,0,0,0.15) 100%)`
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
