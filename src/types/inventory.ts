import { Database, ItemStatus } from './database.types';

export type InventoryItemRow = Database['public']['Tables']['inventory_items']['Row'];
export type StorageLocationRow = Database['public']['Tables']['storage_locations']['Row'];
export type CategoryRow = Database['public']['Tables']['categories']['Row'];
export type ShoppingItemRow = Database['public']['Tables']['shopping_list_items']['Row'];
export type HouseholdRow = Database['public']['Tables']['households']['Row'];
export type HouseholdMemberRow = Database['public']['Tables']['household_members']['Row'];

export type TrafficLightStatus = 'red' | 'yellow' | 'green';

export interface EnrichedInventoryItem extends InventoryItemRow {
  storage_location?: StorageLocationRow;
  category?: CategoryRow | null;
  days_remaining: number;
  traffic_light: TrafficLightStatus;
  urgency_label: string;
}

export type UnitType =
  | 'unidad'
  | 'kg'
  | 'g'
  | 'litro'
  | 'ml'
  | 'paquete'
  | 'lata';

export const VALID_UNITS: UnitType[] = [
  'unidad',
  'kg',
  'g',
  'litro',
  'ml',
  'paquete',
  'lata',
];

export const DEFAULT_STORAGE_LOCATIONS = [
  'Nevera',
  'Congelador',
  'Despensa Seca',
  'Frutero',
] as const;

export type DefaultStorageLocation = (typeof DEFAULT_STORAGE_LOCATIONS)[number];
