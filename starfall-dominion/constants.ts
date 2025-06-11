
import { Coordinates, ResourceType, TileType } from './types';

export const BOARD_SIZE = 7; // 7x7 grid
export const VP_GOAL = 7;
export const MAX_MOVEMENT_RANGE = 3;

export const PLAYER_CONFIG = [
  { id: 1, name: 'Orion Squad', color: 'bg-red-500',textColor: 'text-red-300', position: { x: 0, y: 0 } },
  { id: 2, name: 'Cygnus Corp', color: 'bg-blue-500', textColor: 'text-blue-300', position: { x: BOARD_SIZE - 1, y: BOARD_SIZE - 1 } },
];

export const INITIAL_RESOURCES: Record<ResourceType, number> = {
  [ResourceType.SCRAP]: 2,
  [ResourceType.ENERGY]: 1,
  [ResourceType.BIO_MATTER]: 1,
};

export const COMMAND_TOWER_COST = { [ResourceType.SCRAP]: 2, [ResourceType.ENERGY]: 2 };
export const COMMAND_TOWER_VP = 2; // VP per turn while controlled

export const STARSHIP_CORE_VP_REWARD = 3;
export const STARSHIP_CORE_RESOURCE_COST_TYPE = ResourceType.ENERGY; // Example cost type
export const STARSHIP_CORE_RESOURCE_COST_AMOUNT = 1;


export const ANCIENT_RUIN_VP = 1;

// Define specific locations for key tiles
// Ensure these coordinates are within BOARD_SIZE
export const KEY_LOCATIONS_CONFIG: { coords: Coordinates, type: TileType }[] = [
  { coords: { x: Math.floor(BOARD_SIZE / 2), y: Math.floor(BOARD_SIZE / 2) }, type: TileType.STARSHIP_CORE },
  { coords: { x: 1, y: BOARD_SIZE - 2 }, type: TileType.COMMAND_TOWER },
  { coords: { x: BOARD_SIZE - 2, y: 1 }, type: TileType.COMMAND_TOWER },
  { coords: { x: 0, y: Math.floor(BOARD_SIZE / 2) }, type: TileType.ANCIENT_RUIN },
  { coords: { x: BOARD_SIZE - 1, y: Math.floor(BOARD_SIZE / 2) }, type: TileType.ANCIENT_RUIN },
];

export const RESOURCE_NODES_CONFIG: { coords: Coordinates, type: TileType, resource: ResourceType }[] = [
    { coords: { x: 0, y: 2 }, type: TileType.SCRAP_HEAP, resource: ResourceType.SCRAP },
    { coords: { x: 2, y: 0 }, type: TileType.SCRAP_HEAP, resource: ResourceType.SCRAP },
    { coords: { x: BOARD_SIZE -1, y: BOARD_SIZE - 3}, type: TileType.SCRAP_HEAP, resource: ResourceType.SCRAP },
    { coords: { x: BOARD_SIZE - 3, y: BOARD_SIZE - 1}, type: TileType.SCRAP_HEAP, resource: ResourceType.SCRAP },
    
    { coords: { x: 1, y: 1 }, type: TileType.ENERGY_CONDUIT, resource: ResourceType.ENERGY },
    { coords: { x: BOARD_SIZE - 2, y: BOARD_SIZE - 2 }, type: TileType.ENERGY_CONDUIT, resource: ResourceType.ENERGY },
    { coords: { x: Math.floor(BOARD_SIZE / 2), y: 0 }, type: TileType.ENERGY_CONDUIT, resource: ResourceType.ENERGY },
    
    { coords: { x: 3, y: BOARD_SIZE - 1 }, type: TileType.OVERGROWN_SECTOR, resource: ResourceType.BIO_MATTER },
    { coords: { x: BOARD_SIZE - 1, y: 3 }, type: TileType.OVERGROWN_SECTOR, resource: ResourceType.BIO_MATTER },
];

export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';
