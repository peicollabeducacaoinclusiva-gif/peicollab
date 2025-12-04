export interface SchoolTransport {
  id: string;
  school_id: string;
  tenant_id: string;
  vehicle_type: 'onibus' | 'van' | 'microonibus' | 'outro';
  license_plate: string;
  vehicle_model?: string;
  vehicle_year?: number;
  capacity: number;
  driver_id?: string;
  driver_name?: string;
  driver_license?: string;
  driver_phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransportRoute {
  id: string;
  school_id: string;
  route_name: string;
  route_code?: string;
  route_data?: Record<string, any>;
  stops: RouteStop[];
  morning_departure_time?: string;
  morning_arrival_time?: string;
  afternoon_departure_time?: string;
  afternoon_arrival_time?: string;
  vehicle_id?: string;
  vehicle_license_plate?: string;
  student_count?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RouteStop {
  name: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  order: number;
  time?: string;
}

export interface StudentTransport {
  id: string;
  student_id: string;
  student_name?: string;
  route_id: string;
  route_name?: string;
  academic_year: number;
  boarding_stop?: string;
  disembarkation_stop?: string;
  shift?: 'manha' | 'tarde' | 'integral';
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface TransportAttendance {
  id: string;
  student_id: string;
  student_name?: string;
  route_id: string;
  route_name?: string;
  vehicle_id?: string;
  attendance_date: string;
  attendance_time: string;
  attendance_type: 'boarding' | 'disembarkation';
  latitude?: number;
  longitude?: number;
  verification_method?: 'qr_code' | 'biometric' | 'manual' | 'rfid';
  verification_code?: string;
  status: 'present' | 'absent' | 'late';
  recorded_by?: string;
  created_at: string;
}

