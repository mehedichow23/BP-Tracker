export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          household_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          household_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          household_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      readings: {
        Row: {
          id: string;
          user_id: string;
          systolic: number;
          diastolic: number;
          pulse: number | null;
          taken_at: string;
          notes: string | null;
          image_path: string | null;
          source: "manual" | "ocr";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          systolic: number;
          diastolic: number;
          pulse?: number | null;
          taken_at: string;
          notes?: string | null;
          image_path?: string | null;
          source?: "manual" | "ocr";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          systolic?: number;
          diastolic?: number;
          pulse?: number | null;
          taken_at?: string;
          notes?: string | null;
          image_path?: string | null;
          source?: "manual" | "ocr";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
