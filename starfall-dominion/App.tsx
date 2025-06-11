
import React, { useState, useEffect, useCallback } from 'react';
import { Coordinates, TileData, Player, GamePhase, TileType, ResourceType, GameLogEntry, GenerateContentResponseWithGrounding, GroundingChunk } from './types';
import { BOARD_SIZE, VP_GOAL, PLAYER_CONFIG, INITIAL_RESOURCES, KEY_LOCATIONS_CONFIG, RESOURCE_NODES_CONFIG, MAX_MOVEMENT_RANGE, COMMAND_TOWER_COST, COMMAND_TOWER_VP, STARSHIP_CORE_VP_REWARD, ANCIENT_RUIN_VP, STARSHIP_CORE_RESOURCE_COST_TYPE, STARSHIP_CORE_RESOURCE_COST_AMOUNT } from './constants';
import Tile from './components/Tile';
import PlayerInfo from './components/PlayerInfo';
import GameControls from './components/GameControls';
import Modal from './components/Modal';
import RulebookContent from './components/Rulebook';
import { generateFlavorText, generateStoryForGame } from './services/geminiService';

const generateInitialBoard = (): TileData[][] => {
  const board: TileData[][] = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    const row: TileData[] = [];
    for (let x = 0; x < BOARD_SIZE; x++) {
      let tileType = TileType.EMPTY_SPACE; // Default to empty

      // Check for key locations
      const keyLocation = KEY_LOCATIONS_CONFIG.find(loc => loc.coords.x === x && loc.coords.y === y);
      if (keyLocation) {
        tileType = keyLocation.type;
      } else {
        // Check for resource nodes
        const resourceNode = RESOURCE_NODES_CONFIG.find(node => node.coords.x === x && node.coords.y === y);
        if (resourceNode) {
          tileType = resourceNode.type;
        }
      }
      
      row.push({
        id: `tile-${x}-${y}`,
        type: TileType.UNEXPLORED,
        originalType: tileType,
        isRevealed: false,
        // coordinates: { x, y } // This line was removed
      });
    }
    board.push(row);
  }
  return board;
};


const App: React.FC = () => {
  const [board, setBoard] = useState<TileData[][]>(generateInitialBoard());
  const [players, setPlayers] = useState<Player[]>(
    PLAYER_CONFIG.map(p => ({
      ...p,
      resources: { ...INITIAL_RESOURCES },
      victoryPoints: 0,
      hasExploredStarshipCore: false,
      hasClaimedRuin: new Set<string>(),
    }))
  );
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gamePhase, setGamePhase] = useState<GamePhase>('INITIALIZING');
  const [selectedCoords, setSelectedCoords] = useState<Coordinates | null>(null);
  const [reachableTiles, setReachableTiles] = useState<Coordinates[]>([]);
  const [gameLog, setGameLog] = useState<GameLogEntry[]>([]);
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);
  const [showRulebookModal, setShowRulebookModal] = useState(false);
  const [showFlavorTextModal, setShowFlavorTextModal] = useState<{show: boolean, title: string, text: string, sources?: GroundingChunk[]}>({show: false, title: '', text: ''});
  const [showResourceChoiceModal, setShowResourceChoiceModal] = useState(false);


  const addLogEntry = useCallback((message: string, type: GameLogEntry['type'] = 'info') => {
    setGameLog(prevLog => [{ id: Date.now().toString(), message, type }, ...prevLog.slice(0, 19)]);
  }, []);

  useEffect(() => {
    async function fetchIntroStory() {
        addLogEntry("Generating backstory for Starfall Dominion...", "event");
        setIsLoadingGemini(true);
        const storyResponse: GenerateContentResponseWithGrounding = await generateStoryForGame();
        setIsLoadingGemini(false);
        setShowFlavorTextModal({ show: true, title: "The Legend of Starfall", text: storyResponse.text, sources: storyResponse.candidates?.[0]?.groundingMetadata?.groundingChunks });
        addLogEntry("Game backstory generated.", "event");
    }
    fetchIntroStory();
    setGamePhase('PLAYER_TURN_START');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount


  const currentPlayer = players[currentPlayerIndex];
  const selectedTile = selectedCoords ? board[selectedCoords.y][selectedCoords.x] : null;

  const calculateReachableTiles = useCallback((start: Coordinates, range: number) => {
    const q: {pos: Coordinates, dist: number}[] = [{pos: start, dist: 0}];
    const visited = new Set<string>([`${start.x},${start.y}`]);
    const reachable: Coordinates[] = [];

    while(q.length > 0) {
        const current = q.shift();
        if(!current) continue;

        if (current.dist < range) {
            const neighbors = [
                {x: current.pos.x + 1, y: current.pos.y},
                {x: current.pos.x - 1, y: current.pos.y},
                {x: current.pos.x, y: current.pos.y + 1},
                {x: current.pos.x, y: current.pos.y - 1},
            ];

            for (const n of neighbors) {
                if(n.x >=0 && n.x < BOARD_SIZE && n.y >= 0 && n.y < BOARD_SIZE && !visited.has(`${n.x},${n.y}`)) {
                    // Check if tile is occupied by another player
                    const isOccupiedByOther = players.some(p => p.id !== currentPlayer.id && p.position.x === n.x && p.position.y === n.y);
                    if (!isOccupiedByOther) {
                        visited.add(`${n.x},${n.y}`);
                        q.push({pos: n, dist: current.dist + 1});
                        reachable.push(n);
                    }
                }
            }
        }
    }
    return reachable;
  }, [players, currentPlayer.id]);

  useEffect(() => {
    if (gamePhase === 'PLAYER_TURN_START') {
      setSelectedCoords(currentPlayer.position);
      setGamePhase('MOVEMENT');
      addLogEntry(`${currentPlayer.name}'s turn. Movement phase.`, "info");
    } else if (gamePhase === 'MOVEMENT' && currentPlayer.position) {
        setReachableTiles(calculateReachableTiles(currentPlayer.position, MAX_MOVEMENT_RANGE));
    } else {
        setReachableTiles([]);
    }
  }, [gamePhase, currentPlayer.position, currentPlayer.name, addLogEntry, calculateReachableTiles]);


  const handleWinCondition = useCallback((player: Player) => {
    if (player.victoryPoints >= VP_GOAL) {
      setGamePhase('GAME_OVER');
      addLogEntry(`${player.name} has reached ${VP_GOAL} VP and WINS!`, "event");
      setShowFlavorTextModal({show: true, title: "Victory!", text: `${player.name} is the new master of Starfall Dominion!`});
      return true;
    }
    return false;
  }, [addLogEntry]);


  const endTurn = useCallback(() => {
    if (gamePhase === 'GAME_OVER') return;

    let vpFromTowers = 0;
    board.forEach(row => row.forEach(tile => {
        if (tile.type === TileType.COMMAND_TOWER && tile.controlledByPlayerId === currentPlayer.id) {
            vpFromTowers += COMMAND_TOWER_VP;
        }
    }));

    if (vpFromTowers > 0) {
        const updatedPlayer = { ...currentPlayer, victoryPoints: currentPlayer.victoryPoints + vpFromTowers };
        const newPlayers = players.map(p => p.id === currentPlayer.id ? updatedPlayer : p);
        setPlayers(newPlayers);
        addLogEntry(`${currentPlayer.name} gained ${vpFromTowers} VP from Command Towers. Total VP: ${updatedPlayer.victoryPoints}.`, "action");
        if (handleWinCondition(updatedPlayer)) return;
    }
    
    setSelectedCoords(null);
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    setCurrentPlayerIndex(nextPlayerIndex);
    setGamePhase('PLAYER_TURN_START');
    addLogEntry(`Turn ended.`, "info");
  }, [currentPlayer, currentPlayerIndex, players, addLogEntry, gamePhase, board, handleWinCondition]);


  const handleTileClick = useCallback(async (x: number, y: number) => {
    if (gamePhase === 'MOVEMENT') {
        // const targetTile = board[y][x]; // Not directly used, but good for debugging
        // const currentPos = currentPlayer.position; // Not directly used, but good for debugging
        // const distance = Math.abs(x - currentPos.x) + Math.abs(y - currentPos.y); // Manhattan distance
        
        // Is the tile in the reachable list?
        if (!reachableTiles.find(rt => rt.x === x && rt.y === y)) {
            addLogEntry("Invalid move: Tile is out of range or blocked.", "error");
            return;
        }

        const newPlayers = players.map(p => 
            p.id === currentPlayer.id ? { ...p, position: { x, y } } : p
        );
        setPlayers(newPlayers);
        setSelectedCoords({ x, y });
        setGamePhase('ACTION');
        addLogEntry(`${currentPlayer.name} moved to (${x},${y}). Action phase.`, "action");
        setReachableTiles([]); // Clear reachable tiles after move
    } else if (gamePhase === 'ACTION') {
        setSelectedCoords({ x, y });
        addLogEntry(`Selected tile (${x},${y}) for action.`, "info");
    }
  }, [gamePhase, currentPlayer, players, addLogEntry, reachableTiles]);


  const exploreTile = useCallback(async () => {
    if (!selectedCoords || !selectedTile || selectedTile.isRevealed || gamePhase !== 'ACTION') return;

    setIsLoadingGemini(true);
    const flavor = await generateFlavorText(selectedTile.originalType);
    setIsLoadingGemini(false);

    const newBoard = board.map(row => row.map(tile => {
      if (tile.id === selectedTile.id) {
        return { ...tile, isRevealed: true, type: tile.originalType, flavorText: flavor };
      }
      return tile;
    }));
    setBoard(newBoard);
    setShowFlavorTextModal({show: true, title: `Exploring ${selectedTile.originalType}`, text: flavor});
    addLogEntry(`${currentPlayer.name} explored ${selectedTile.originalType} at (${selectedCoords.x},${selectedCoords.y}). Flavor: ${flavor}`, "action");

    // Handle immediate effects of exploration
    let resourceGained: ResourceType | null = null;
    let amountGained = 0;

    switch (selectedTile.originalType) {
      case TileType.SCRAP_HEAP: resourceGained = ResourceType.SCRAP; amountGained = 1; break;
      case TileType.ENERGY_CONDUIT: resourceGained = ResourceType.ENERGY; amountGained = 1; break;
      case TileType.OVERGROWN_SECTOR: resourceGained = ResourceType.BIO_MATTER; amountGained = 1; break;
      default: // No resource on exploring other types like Empty, Ruin, Core, Tower
        break; 
    }

    if (resourceGained && amountGained > 0) {
      const updatedPlayer = {
        ...currentPlayer,
        resources: { ...currentPlayer.resources, [resourceGained]: currentPlayer.resources[resourceGained] + amountGained }
      };
      setPlayers(players.map(p => p.id === currentPlayer.id ? updatedPlayer : p));
      addLogEntry(`${currentPlayer.name} found ${amountGained} ${resourceGained}.`, "action");
    }
    // Note: ANCIENT_RUIN and STARSHIP_CORE VP are handled by separate actions after exploration.

  }, [selectedCoords, selectedTile, gamePhase, board, currentPlayer, players, addLogEntry]);

  const gatherResource = useCallback(() => {
    if (!selectedCoords || !selectedTile || !selectedTile.isRevealed || gamePhase !== 'ACTION') return;
    
    let resourceToGather: ResourceType | null = null;
    if (selectedTile.type === TileType.SCRAP_HEAP) resourceToGather = ResourceType.SCRAP;
    else if (selectedTile.type === TileType.ENERGY_CONDUIT) resourceToGather = ResourceType.ENERGY;
    else if (selectedTile.type === TileType.OVERGROWN_SECTOR) resourceToGather = ResourceType.BIO_MATTER;

    if (resourceToGather) {
      const updatedPlayer = {
        ...currentPlayer,
        resources: { ...currentPlayer.resources, [resourceToGather]: currentPlayer.resources[resourceToGather] + 1 }
      };
      setPlayers(players.map(p => p.id === currentPlayer.id ? updatedPlayer : p));
      addLogEntry(`${currentPlayer.name} gathered 1 ${resourceToGather}.`, "action");
    } else {
      addLogEntry("Cannot gather from this tile type.", "error");
    }
  }, [selectedCoords, selectedTile, gamePhase, currentPlayer, players, addLogEntry]);

  const buildOutpost = useCallback(() => {
    if (!selectedCoords || !selectedTile || selectedTile.type !== TileType.COMMAND_TOWER || gamePhase !== 'ACTION') return;
    
    if (currentPlayer.resources[ResourceType.SCRAP] >= COMMAND_TOWER_COST[ResourceType.SCRAP] &&
        currentPlayer.resources[ResourceType.ENERGY] >= COMMAND_TOWER_COST[ResourceType.ENERGY]) {
      
      const updatedPlayer = {
        ...currentPlayer,
        resources: {
          ...currentPlayer.resources,
          [ResourceType.SCRAP]: currentPlayer.resources[ResourceType.SCRAP] - COMMAND_TOWER_COST[ResourceType.SCRAP],
          [ResourceType.ENERGY]: currentPlayer.resources[ResourceType.ENERGY] - COMMAND_TOWER_COST[ResourceType.ENERGY],
        }
      };
      setPlayers(players.map(p => p.id === currentPlayer.id ? updatedPlayer : p));

      const newBoard = board.map(row => row.map(tile => 
        tile.id === selectedTile.id ? { ...tile, controlledByPlayerId: currentPlayer.id } : tile
      ));
      setBoard(newBoard);
      addLogEntry(`${currentPlayer.name} built an Outpost at Command Tower (${selectedCoords.x},${selectedCoords.y}).`, "action");

    } else {
      addLogEntry("Not enough resources to build an Outpost.", "error");
    }
  }, [selectedCoords, selectedTile, gamePhase, currentPlayer, players, board, addLogEntry]);

  const handleClaimAncientTech = useCallback((chosenResource: ResourceType) => {
    if (!selectedCoords || !selectedTile || selectedTile.type !== TileType.ANCIENT_RUIN || gamePhase !== 'ACTION' || currentPlayer.hasClaimedRuin.has(selectedTile.id)) return;

    const updatedPlayer = {
      ...currentPlayer,
      victoryPoints: currentPlayer.victoryPoints + ANCIENT_RUIN_VP,
      resources: { ...currentPlayer.resources, [chosenResource]: currentPlayer.resources[chosenResource] + 1 },
      hasClaimedRuin: new Set(currentPlayer.hasClaimedRuin).add(selectedTile.id)
    };
    
    const newPlayers = players.map(p => p.id === currentPlayer.id ? updatedPlayer : p);
    setPlayers(newPlayers);
    
    addLogEntry(`${currentPlayer.name} claimed Ancient Tech at (${selectedCoords.x},${selectedCoords.y}), gaining ${ANCIENT_RUIN_VP} VP and 1 ${chosenResource}. Total VP: ${updatedPlayer.victoryPoints}.`, "action");
    setShowResourceChoiceModal(false); // This state isn't used for opening, but good practice to close if it were.
    if (handleWinCondition(updatedPlayer)) return;

  }, [selectedCoords, selectedTile, gamePhase, currentPlayer, players, addLogEntry, handleWinCondition]);


  const investigateStarshipCore = useCallback(() => {
    if (!selectedCoords || !selectedTile || selectedTile.type !== TileType.STARSHIP_CORE || gamePhase !== 'ACTION' || currentPlayer.hasExploredStarshipCore) return;

    if (currentPlayer.resources[STARSHIP_CORE_RESOURCE_COST_TYPE] >= STARSHIP_CORE_RESOURCE_COST_AMOUNT) {
      const updatedPlayer = {
        ...currentPlayer,
        victoryPoints: currentPlayer.victoryPoints + STARSHIP_CORE_VP_REWARD,
        resources: { ...currentPlayer.resources, [STARSHIP_CORE_RESOURCE_COST_TYPE]: currentPlayer.resources[STARSHIP_CORE_RESOURCE_COST_TYPE] - STARSHIP_CORE_RESOURCE_COST_AMOUNT },
        hasExploredStarshipCore: true
      };
      setPlayers(players.map(p => p.id === currentPlayer.id ? updatedPlayer : p));
      addLogEntry(`${currentPlayer.name} investigated the Starship Core, gaining ${STARSHIP_CORE_VP_REWARD} VP! Total VP: ${updatedPlayer.victoryPoints}.`, "action");
      if (handleWinCondition(updatedPlayer)) return;
    } else {
      addLogEntry(`Not enough ${STARSHIP_CORE_RESOURCE_COST_TYPE} to investigate the Starship Core.`, "error");
    }
  }, [selectedCoords, selectedTile, gamePhase, currentPlayer, players, addLogEntry, handleWinCondition]);


  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 selection:bg-cyan-500 selection:text-white">
      <header className="mb-6 text-center">
        <h1 className="text-5xl font-bold text-cyan-400 tracking-tight">Starfall Dominion</h1>
        <p className="text-slate-400">The battle for the fallen giant begins...</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
        {/* Game Board - takes up 2/3 on md screens */}
        <div className="md:col-span-2 bg-slate-800 p-2 sm:p-4 rounded-lg shadow-2xl">
            <div className={`grid grid-cols-${BOARD_SIZE} gap-0`}> {/* Changed gap-0.5 to gap-0 */}
                {board.map((row, y) =>
                    row.map((tile, x) => (
                    <Tile
                        key={tile.id}
                        tile={tile}
                        x={x}
                        y={y}
                        onTileClick={handleTileClick}
                        isPlayerOnTile={players.find(p => p.position.x === x && p.position.y === y)}
                        isSelected={selectedCoords?.x === x && selectedCoords?.y === y}
                        isReachable={gamePhase === 'MOVEMENT' && reachableTiles.some(rt => rt.x === x && rt.y === y)}
                    />
                    ))
                )}
            </div>
        </div>

        {/* Player Info & Controls - takes up 1/3 on md screens */}
        <div className="space-y-6">
          <PlayerInfo player={players[0]} isCurrentPlayer={currentPlayer.id === players[0].id} />
          {players.length > 1 && <PlayerInfo player={players[1]} isCurrentPlayer={currentPlayer.id === players[1].id} />}
          
          <GameControls
            currentPlayer={currentPlayer}
            selectedTile={selectedTile}
            gamePhase={gamePhase}
            onEndTurn={endTurn}
            onExplore={exploreTile}
            onGather={gatherResource}
            onBuildOutpost={buildOutpost}
            onClaimAncientTech={handleClaimAncientTech}
            onInvestigateCore={investigateStarshipCore}
            isLoading={isLoadingGemini}
            showRulebook={() => setShowRulebookModal(true)}
          />
        </div>
      </div>

      {/* Game Log */}
      <div className="mt-8 w-full max-w-6xl bg-slate-800 p-4 rounded-lg shadow-xl">
        <h3 className="text-lg font-semibold text-cyan-400 mb-2">Game Log</h3>
        <div className="h-40 overflow-y-auto space-y-1 text-sm">
          {gameLog.map(entry => (
            <p key={entry.id} className={`${entry.type === 'error' ? 'text-red-400' : entry.type === 'action' ? 'text-yellow-300' : entry.type === 'event' ? 'text-sky-300' : 'text-slate-300'}`}>
              {entry.message}
            </p>
          ))}
        </div>
      </div>
      
      <Modal isOpen={showRulebookModal} onClose={() => setShowRulebookModal(false)} title="Starfall Dominion Rules">
        <RulebookContent />
      </Modal>

      <Modal 
        isOpen={showFlavorTextModal.show} 
        onClose={() => setShowFlavorTextModal({show: false, title: '', text: '', sources: []})} 
        title={showFlavorTextModal.title}
      >
        <p className="whitespace-pre-wrap">{showFlavorTextModal.text}</p>
        {showFlavorTextModal.sources && showFlavorTextModal.sources.length > 0 && (
            <div className="mt-4 pt-2 border-t border-slate-700">
                <h4 className="text-sm font-semibold text-slate-400 mb-1">Sources:</h4>
                <ul className="list-disc list-inside text-xs space-y-0.5">
                    {showFlavorTextModal.sources.map((source, index) => source.web && (
                        <li key={index}>
                            <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">
                                {source.web.title || source.web.uri}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        )}
      </Modal>
    </div>
  );
};

export default App;
