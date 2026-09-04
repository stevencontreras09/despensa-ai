export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MemberRole = 'admin' | 'member';
export type ItemStatus = 'active' | 'consumed' | 'wasted';
export type RecipeDifficulty = 'Fácil' | 'Intermedio' | 'Avanzado';

export type Database = {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      household_members: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          role: MemberRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          role?: MemberRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          user_id?: string;
          role?: MemberRole;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "household_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      storage_locations: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          is_default?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "storage_locations_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          default_shelf_life_days: number;
          ideal_location: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          default_shelf_life_days?: number;
          ideal_location: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          default_shelf_life_days?: number;
          ideal_location?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      inventory_items: {
        Row: {
          id: string;
          household_id: string;
          storage_location_id: string;
          category_id: string | null;
          name: string;
          quantity: number;
          unit: string;
          purchase_date: string;
          expiration_date: string;
          estimated_cost: number | null;
          status: ItemStatus;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          storage_location_id: string;
          category_id?: string | null;
          name: string;
          quantity?: number;
          unit?: string;
          purchase_date?: string;
          expiration_date: string;
          estimated_cost?: number | null;
          status?: ItemStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          storage_location_id?: string;
          category_id?: string | null;
          name?: string;
          quantity?: number;
          unit?: string;
          purchase_date?: string;
          expiration_date?: string;
          estimated_cost?: number | null;
          status?: ItemStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_items_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_items_storage_location_id_fkey";
            columns: ["storage_location_id"];
            isOneToOne: false;
            referencedRelation: "storage_locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      shopping_list_items: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          quantity: number;
          unit: string;
          is_auto_suggested: boolean;
          is_purchased: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          quantity?: number;
          unit?: string;
          is_auto_suggested?: boolean;
          is_purchased?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          quantity?: number;
          unit?: string;
          is_auto_suggested?: boolean;
          is_purchased?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };
      idempotency_keys: {
        Row: {
          id: string;
          household_id: string;
          key: string;
          action: string;
          response: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          key: string;
          action: string;
          response: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          key?: string;
          action?: string;
          response?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "idempotency_keys_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };
      consumption_logs: {
        Row: {
          id: string;
          household_id: string;
          item_id: string | null;
          item_name: string;
          action: ItemStatus;
          quantity: number;
          unit: string;
          financial_impact: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          item_id?: string | null;
          item_name: string;
          action: ItemStatus;
          quantity: number;
          unit: string;
          financial_impact?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          item_id?: string | null;
          item_name?: string;
          action?: ItemStatus;
          quantity?: number;
          unit?: string;
          financial_impact?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "consumption_logs_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_member_of: {
        Args: { p_household_id: string };
        Returns: boolean;
      };
      is_admin_of: {
        Args: { p_household_id: string };
        Returns: boolean;
      };
      deduct_recipe_atomic: {
        Args: {
          p_household_id: string;
          p_idempotency_key: string;
          p_recipe_id: string;
          p_recipe_title: string;
          p_items: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      member_role: MemberRole;
      item_status: ItemStatus;
      recipe_difficulty: RecipeDifficulty;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
