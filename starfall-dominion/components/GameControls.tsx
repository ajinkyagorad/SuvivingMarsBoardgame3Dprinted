
import React from 'react';
import { GamePhase, Player, TileData, ResourceType } from '../types';
import { COMMAND_TOWER_COST, STARSHIP_CORE_RESOURCE_COST_TYPE, STARSHIP_CORE_RESOURCE_COST_AMOUNT } from '../constants';

interface GameControlsProps {
  currentPlayer: Player;
  selectedTile: TileData | null;
  gamePhase: GamePhase;
  onEndTurn: () => void;
  onExplore: () => void;
  onGather: () => void;
  onBuildOutpost: () => void;
  onClaimAncientTech: (resource: ResourceType) => void;
  onInvestigateCore: () => void;
  isLoading: boolean;
  showRulebook: () => void;
}

const actionButtonClasses = "w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-4 rounded-md transition duration-150 ease-in-out disabled:bg-slate-500 disabled:cursor-not-allowed";

const GameControls: React.FC<GameControlsProps> = ({
  currentPlayer,
  selectedTile,
  gamePhase,
  onEndTurn,
  onExplore,
  onGather,
  onBuildOutpost,
  onClaimAncientTech,
  onInvestigateCore,
  isLoading,
  showRulebook
}) => {
  const canExplore = selectedTile && !selectedTile.isRevealed && gamePhase === 'ACTION';
  
  const canGather = selectedTile && selectedTile.isRevealed &&
    (selectedTile.type === 'Scrap Heap' || selectedTile.type === 'Energy Conduit' || selectedTile.type === 'Overgrown Sector') &&
    gamePhase === 'ACTION';

  const canBuildOutpost = selectedTile && selectedTile.type === 'Command Tower' &&
    gamePhase === 'ACTION' &&
    currentPlayer.resources[ResourceType.SCRAP] >= COMMAND_TOWER_COST[ResourceType.SCRAP] &&
    currentPlayer.resources[ResourceType.ENERGY] >= COMMAND_TOWER_COST[ResourceType.ENERGY] &&
    selectedTile.controlledByPlayerId !== currentPlayer.id;

  const canClaimAncientTech = selectedTile && selectedTile.type === 'Ancient Ruin' &&
    selectedTile.isRevealed && !currentPlayer.hasClaimedRuin.has(selectedTile.id) &&
    gamePhase === 'ACTION';
  
  const canInvestigateCore = selectedTile && selectedTile.type === 'Starship Core' &&
    selectedTile.isRevealed && !currentPlayer.hasExploredStarshipCore &&
    currentPlayer.resources[STARSHIP_CORE_RESOURCE_COST_TYPE] >= STARSHIP_CORE_RESOURCE_COST_AMOUNT &&
    gamePhase === 'ACTION';

  return (
    <div className="p-4 bg-slate-800 rounded-lg shadow-md space-y-3">
      <h3 className="text-lg font-semibold text-cyan-400 mb-2">Actions</h3>
      {isLoading && <div className="text-center text-sky-300">Processing...</div>}
      
      {gamePhase === 'ACTION' && (
        <>
          <button onClick={onExplore} disabled={!canExplore || isLoading} className={actionButtonClasses}>
            Explore Tile
          </button>
          <button onClick={onGather} disabled={!canGather || isLoading} className={actionButtonClasses}>
            Gather Resource
          </button>
          <button onClick={onBuildOutpost} disabled={!canBuildOutpost || isLoading} className={actionButtonClasses}>
            Build Outpost ({COMMAND_TOWER_COST[ResourceType.SCRAP]}S, {COMMAND_TOWER_COST[ResourceType.ENERGY]}E)
          </button>
          {canClaimAncientTech && (
             <div className="space-y-1">
                <p className="text-sm text-slate-300">Claim Ancient Tech: Choose bonus resource</p>
                {Object.values(ResourceType).map(resType => (
                    <button 
                        key={resType}
                        onClick={() => onClaimAncientTech(resType)} 
                        disabled={isLoading} 
                        className={`${actionButtonClasses} bg-purple-600 hover:bg-purple-500 text-xs`}
                    >
                        Get 1 {resType}
                    </button>
                ))}
            </div>
          )}
          <button onClick={onInvestigateCore} disabled={!canInvestigateCore || isLoading} className={`${actionButtonClasses} bg-red-600 hover:bg-red-500`}>
            Investigate Core (Cost: 1 {STARSHIP_CORE_RESOURCE_COST_TYPE})
          </button>
        </>
      )}

      {gamePhase !== 'INITIALIZING' && gamePhase !== 'GAME_OVER' && (
         <button onClick={onEndTurn} disabled={isLoading || gamePhase === 'MOVEMENT'} className={`${actionButtonClasses} bg-slate-600 hover:bg-slate-500 mt-2`}>
            End Turn
        </button>
      )}
      <button onClick={showRulebook} className={`${actionButtonClasses} bg-teal-600 hover:bg-teal-500 mt-2`}>
        View Rules
      </button>
       {gamePhase === 'GAME_OVER' && (
        <p className="text-xl font-bold text-green-400 text-center p-4 bg-slate-700 rounded">GAME OVER! {currentPlayer.name} WINS!</p>
      )}
    </div>
  );
};

export default GameControls;
