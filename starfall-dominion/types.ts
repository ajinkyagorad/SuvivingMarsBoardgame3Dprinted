
export enum ResourceType {
  SCRAP = 'Scrap Metal',
  ENERGY = 'Energy Cells',
  BIO_MATTER = 'Bio-Matter',
}

export enum TileType {
  EMPTY_SPACE = 'Empty Space',
  SCRAP_HEAP = 'Scrap Heap',
  ENERGY_CONDUIT = 'Energy Conduit',
  OVERGROWN_SECTOR = 'Overgrown Sector',
  ANCIENT_RUIN = 'Ancient Ruin', // VP + 1 free resource choice
  COMMAND_TOWER = 'Command Tower', // Control for ongoing VP
  STARSHIP_CORE = 'Starship Core', // Big one-time VP, costs resource
  UNEXPLORED = 'Unexplored',
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface TileData {
  id: string;
  type: TileType;
  originalType: TileType; // Type before exploration
  isRevealed: boolean;
  controlledByPlayerId?: number; // Player ID controlling this tile (e.g., Command Tower)
  flavorText?: string;
  resources?: Partial<Record<ResourceType, number>>; // Resources available on this tile
}

export interface Player {
  id: number;
  name: string;
  color: string;
  position: Coordinates;
  resources: Record<ResourceType, number>;
  victoryPoints: number;
  hasExploredStarshipCore: boolean; // To prevent multiple core claims
  hasClaimedRuin: Set<string>; // Set of ruin tile IDs claimed
}

export type GamePhase = 'INITIALIZING' | 'PLAYER_TURN_START' | 'MOVEMENT' | 'ACTION' | 'GAME_OVER';

export interface GameLogEntry {
  id: string;
  message: string;
  type: 'info' | 'action' | 'event' | 'error';
}

// For Gemini Service
export interface GroundingChunkWeb {
  uri: string;
  title: string;
}
export interface GroundingChunk {
  web?: GroundingChunkWeb;
  // Other types of chunks can be added here if needed
}
export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  // Other grounding metadata fields can be added
}
export interface Candidate {
  groundingMetadata?: GroundingMetadata;
  // Other candidate fields
}
export interface GenerateContentResponseWithGrounding {
  text: string;
  candidates?: Candidate[];
}
