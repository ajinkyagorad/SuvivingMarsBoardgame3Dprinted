
import React from 'react';
import { TileData, TileType, Player } from '../types';
import { PLAYER_CONFIG } from '../constants';
import {
  QuestionMarkCircleIcon,
  Cog6ToothIcon,
  BoltIcon,
  SunIcon, // Using SunIcon for Overgrown/Bio-Matter as a proxy for life/growth
  BuildingLibraryIcon, // For Ancient Ruin
  SignalIcon, // For Command Tower
  FireIcon, // For Starship Core (danger/energy)
  EllipsisHorizontalIcon, // For Empty Space
} from '@heroicons/react/24/solid';

interface TileProps {
  tile: TileData;
  onTileClick: (x: number, y: number) => void;
  x: number;
  y: number;
  isPlayerOnTile?: Player;
  isSelected?: boolean;
  isReachable?: boolean;
}

const ThematicTileContent: React.FC<{ type: TileType, revealed: boolean, controlledBy?: number }> = ({ type, revealed, controlledBy }) => {
  const controllerPlayerConfig = controlledBy ? PLAYER_CONFIG.find(p => p.id === controlledBy) : null;
  const controllerColorClass = controllerPlayerConfig ? controllerPlayerConfig.color : 'bg-slate-500';

  if (!revealed) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-800 hover:bg-slate-700 transition-colors duration-150">
        <QuestionMarkCircleIcon className="w-10 h-10 text-slate-500" />
      </div>
    );
  }

  let tileIcon;
  let baseBg = 'bg-slate-700';
  let iconColor = 'text-slate-400';
  const iconSize = "w-8 h-8 md:w-10 md:h-10"; // Responsive icon size

  switch (type) {
    case TileType.EMPTY_SPACE:
      baseBg = 'bg-slate-600 hover:bg-slate-500';
      iconColor = 'text-slate-400 opacity-50';
      tileIcon = <EllipsisHorizontalIcon className={iconSize} />;
      break;
    case TileType.SCRAP_HEAP:
      baseBg = 'bg-yellow-900 hover:bg-yellow-800'; // Darker base
      iconColor = 'text-yellow-400';
      tileIcon = <Cog6ToothIcon className={iconSize} />;
      break;
    case TileType.ENERGY_CONDUIT:
      baseBg = 'bg-sky-900 hover:bg-sky-800'; // Darker base
      iconColor = 'text-sky-300';
      tileIcon = <BoltIcon className={iconSize} />;
      break;
    case TileType.OVERGROWN_SECTOR:
      baseBg = 'bg-green-900 hover:bg-green-800'; // Darker base
      iconColor = 'text-green-400';
      tileIcon = <SunIcon className={iconSize} />; // Representing life/photosynthesis
      break;
    case TileType.ANCIENT_RUIN:
      baseBg = 'bg-purple-900 hover:bg-purple-800'; // Darker base
      iconColor = 'text-purple-400';
      tileIcon = <BuildingLibraryIcon className={iconSize} />;
      break;
    case TileType.COMMAND_TOWER:
      baseBg = `bg-orange-900 hover:bg-orange-800`; // Darker base
      iconColor = `text-orange-400`;
      tileIcon = <SignalIcon className={`${iconSize} ${controllerPlayerConfig ? controllerPlayerConfig.textColor : ''}`} />;
      break;
    case TileType.STARSHIP_CORE:
      baseBg = 'bg-red-900 hover:bg-red-800'; // Darker base
      iconColor = 'text-red-400';
      tileIcon = <FireIcon className={iconSize} />;
      break;
    default:
      tileIcon = <QuestionMarkCircleIcon className={`${iconSize} text-slate-500`} />;
  }

  return (
    <div className={`w-full h-full flex items-center justify-center ${baseBg} ${iconColor} transition-colors duration-150 relative`}>
      {tileIcon}
      {type === TileType.COMMAND_TOWER && controlledBy && controllerPlayerConfig && (
         <div 
            className={`absolute bottom-1 right-1 w-3 h-3 md:w-4 md:h-4 rounded-full ${controllerColorClass} border-2 border-slate-200 shadow-md`}
            title={`Controlled by ${controllerPlayerConfig.name}`}
        />
      )}
    </div>
  );
};


const Tile: React.FC<TileProps> = ({ tile, onTileClick, x, y, isPlayerOnTile, isSelected, isReachable }) => {
  let borderColor = 'border-slate-700'; 
  let ringStyle = '';

  if (isSelected) {
    borderColor = 'border-cyan-400';
    ringStyle = 'ring-2 ring-cyan-400 ring-inset';
  } else if (isReachable && tile.isRevealed) {
    borderColor = 'border-green-500';
    ringStyle = 'ring-1 ring-green-500 ring-inset opacity-90';
  } else if (isReachable && !tile.isRevealed) {
    borderColor = 'border-green-600'; 
    ringStyle = 'ring-1 ring-green-600 ring-inset opacity-90';
  } else if (!tile.isRevealed) {
    borderColor = 'border-slate-800'; 
  }
  
  const playerConfig = isPlayerOnTile ? PLAYER_CONFIG.find(p => p.id === isPlayerOnTile.id) : null;
  const tileTitle = tile.isRevealed 
    ? `${tile.type} (${x},${y})${tile.flavorText ? ` - ${tile.flavorText.substring(0,50)}...` : ''}` 
    : `Unexplored (${x},${y})`;

  return (
    <div
      className={`w-16 h-16 md:w-20 md:h-20 border ${borderColor} ${ringStyle} cursor-pointer transition-all duration-150 ease-in-out relative group`}
      onClick={() => onTileClick(x, y)}
      aria-label={tileTitle}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') onTileClick(x,y)}}
    >
      <ThematicTileContent type={tile.type} revealed={tile.isRevealed} controlledBy={tile.controlledByPlayerId} />
      {playerConfig && (
        <div 
          className={`absolute w-5 h-5 md:w-6 md:h-6 rounded-full ${playerConfig.color} border-2 border-slate-900 shadow-lg flex items-center justify-center text-xs font-bold text-white z-10 pointer-events-none`}
          style={{ transform: 'translate(50%, -50%)', top: '12%', right: '12%' }} 
          title={playerConfig.name}
        >
          {playerConfig.name.substring(0,1)}
        </div>
      )}
      <div 
        className="absolute inset-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-70 rounded-sm overflow-hidden pointer-events-none z-20"
        style={{fontSize: '0.6rem', lineHeight: '0.8rem'}} 
      >
        <p className="text-slate-200 font-semibold truncate">{tile.isRevealed ? tile.type : "Unexplored"}</p>
        <p className="text-slate-300">{`(${x},${y})`}</p>
        {tile.isRevealed && tile.flavorText && <p className="text-slate-400 italic truncate">{tile.flavorText}</p>}
      </div>
    </div>
  );
};

export default Tile;
