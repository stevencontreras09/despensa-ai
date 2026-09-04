import { UnitType, DefaultStorageLocation } from './inventory';

export interface ParsedTicketItem {
  raw_name: string;
  normalized_name: string;
  category: string;
  storage_location: DefaultStorageLocation;
  quantity: number;
  unit: UnitType;
  estimated_cost: number | null;
  default_shelf_life_days: number;
  expiration_date?: string; // calculated: purchase_date + shelf_life
}

export interface TicketExtractionResponse {
  store_name: string | null;
  purchase_date: string | null;
  currency: string | null;
  items: ParsedTicketItem[];
}

export interface UsedInventoryItem {
  item_id: string;
  name: string;
  used_quantity: number;
  unit: string;
}

export interface RescueRecipe {
  id: string;
  title: string;
  description: string;
  prep_time_minutes: number;
  difficulty: 'Fácil' | 'Intermedio' | 'Avanzado';
  rescue_score: string;
  used_inventory_items: UsedInventoryItem[];
  pantry_staples_used: string[];
  missing_ingredients: string[];
  steps: string[];
}

export interface RescueRecipesResponse {
  recipes: RescueRecipe[];
}
