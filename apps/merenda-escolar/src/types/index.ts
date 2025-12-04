export interface MealMenu {
  id: string;
  school_id: string;
  school_name?: string;
  tenant_id: string;
  period_start: string;
  period_end: string;
  meal_type: 'cafe_manha' | 'lanche_manha' | 'almoco' | 'lanche_tarde' | 'jantar';
  menu_data: Record<string, any>;
  daily_menus: DailyMenu[];
  nutritional_info: NutritionalInfo;
  created_at: string;
  updated_at: string;
}

export interface DailyMenu {
  date: string;
  items: MenuItem[];
  nutritional_info?: NutritionalInfo;
}

export interface MenuItem {
  name: string;
  quantity: string;
  unit: string;
  category?: string;
}

export interface NutritionalInfo {
  calories?: number;
  proteins?: number;
  carbs?: number;
  fats?: number;
  vitamins?: Record<string, number>;
}

export interface MealPlan {
  id: string;
  school_id: string;
  tenant_id: string;
  period_start: string;
  period_end: string;
  plan_data: Record<string, any>;
  items: PlanItem[];
  total_estimated_cost: number;
  status: 'draft' | 'approved' | 'purchased' | 'completed';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PlanItem {
  item: string;
  quantity: number;
  unit: string;
  estimated_cost: number;
  category?: string;
}

export interface MealSupplier {
  id: string;
  tenant_id: string;
  supplier_name: string;
  cnpj?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  address?: string;
  categories: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MealPurchase {
  id: string;
  meal_plan_id?: string;
  supplier_id?: string;
  supplier_name?: string;
  school_id: string;
  tenant_id: string;
  purchase_date: string;
  items: PurchaseItem[];
  total_amount: number;
  invoice_number?: string;
  invoice_url?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export interface PurchaseItem {
  item: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  category?: string;
}

export interface MealAttendance {
  id: string;
  student_id: string;
  student_name?: string;
  school_id: string;
  meal_date: string;
  meal_type: 'cafe_manha' | 'lanche_manha' | 'almoco' | 'lanche_tarde' | 'jantar';
  consumed: boolean;
  quantity_served?: number;
  observations?: string;
  recorded_by?: string;
  created_at: string;
}

export interface MealPreparation {
  id: string;
  school_id: string;
  meal_menu_id?: string;
  preparation_date: string;
  meal_type: string;
  items_prepared: PreparationItem[];
  quantity_served: number;
  prepared_by?: string;
  observations?: string;
  created_at: string;
}

export interface PreparationItem {
  item: string;
  quantity: number;
  unit: string;
}

