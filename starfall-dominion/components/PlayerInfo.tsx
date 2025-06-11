
import React from 'react';
import { Player, ResourceType } from '../types';
import { VP_GOAL, PLAYER_CONFIG } from '../constants';

interface PlayerInfoProps {
  player: Player;
  isCurrentPlayer: boolean;
}

const ResourceDisplay: React.FC<{ type: ResourceType, amount: number }> = ({ type, amount }) => {
  let icon = '';
  let color = '';
  switch (type) {
    case ResourceType.SCRAP: icon = '⚙️'; color = 'text-yellow-400'; break;
    case ResourceType.ENERGY: icon = '⚡️'; color = 'text-sky-400'; break;
    case ResourceType.BIO_MATTER: icon = '🌿'; color = 'text-green-400'; break;
  }
  return (
    <div className={`flex items-center space-x-1 ${color}`}>
      <span>{icon}</span>
      <span>{type}:</span>
      <span className="font-semibold">{amount}</span>
    </div>
  );
};

const PlayerInfo: React.FC<PlayerInfoProps> = ({ player, isCurrentPlayer }) => {
  const playerVisualConfig = PLAYER_CONFIG.find(p => p.id === player.id);

  return (
    <div className={`p-4 rounded-lg shadow-md transition-all duration-300 ${isCurrentPlayer ? 'bg-slate-700 ring-2 ring-cyan-500' : 'bg-slate-800'}`}>
      <h3 className={`text-xl font-bold mb-2 ${playerVisualConfig?.textColor || 'text-white'}`}>
        {player.name} {isCurrentPlayer ? '(Current Turn)' : ''}
      </h3>
      <div className="mb-2">
        <span className="font-semibold text-lg">VP: {player.victoryPoints} / {VP_GOAL}</span>
      </div>
      <div className="space-y-1 text-sm">
        {Object.values(ResourceType).map(resourceType => (
          <ResourceDisplay key={resourceType} type={resourceType} amount={player.resources[resourceType]} />
        ))}
      </div>
    </div>
  );
};

export default PlayerInfo;
