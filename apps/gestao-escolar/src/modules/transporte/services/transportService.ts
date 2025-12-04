import { supabase } from '@pei/database';
import type { SchoolTransport, TransportRoute, StudentTransport, TransportAttendance } from '../types';

export const transportService = {
  // Veículos
  async getVehicles(filters?: {
    schoolId?: string;
    tenantId?: string;
    activeOnly?: boolean;
  }) {
    let query = supabase
      .from('school_transport')
      .select('*')
      .order('license_plate');

    if (filters?.schoolId) {
      query = query.eq('school_id', filters.schoolId);
    }
    if (filters?.tenantId) {
      query = query.eq('tenant_id', filters.tenantId);
    }
    if (filters?.activeOnly !== false) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as SchoolTransport[];
  },

  async createVehicle(vehicle: {
    schoolId: string;
    tenantId: string;
    vehicleType: string;
    licensePlate: string;
    capacity: number;
    vehicleModel?: string;
    vehicleYear?: number;
    driverId?: string;
    driverName?: string;
    driverLicense?: string;
    driverPhone?: string;
  }) {
    const { data, error } = await supabase.rpc('create_school_transport', {
      p_school_id: vehicle.schoolId,
      p_tenant_id: vehicle.tenantId,
      p_vehicle_type: vehicle.vehicleType,
      p_license_plate: vehicle.licensePlate,
      p_capacity: vehicle.capacity,
      p_vehicle_model: vehicle.vehicleModel || null,
      p_vehicle_year: vehicle.vehicleYear || null,
      p_driver_id: vehicle.driverId || null,
      p_driver_name: vehicle.driverName || null,
      p_driver_license: vehicle.driverLicense || null,
      p_driver_phone: vehicle.driverPhone || null,
    });

    if (error) throw error;
    return data;
  },

  async updateVehicle(vehicleId: string, updates: Partial<SchoolTransport>) {
    const { data, error } = await supabase
      .from('school_transport')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vehicleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Rotas
  async getRoutes(schoolId: string, activeOnly = true) {
    const { data, error } = await supabase.rpc('get_transport_routes', {
      p_school_id: schoolId,
      p_is_active: activeOnly,
    });

    if (error) throw error;
    return data as TransportRoute[];
  },

  async createRoute(route: {
    schoolId: string;
    routeName: string;
    routeCode?: string;
    stops?: any[];
    morningDepartureTime?: string;
    morningArrivalTime?: string;
    afternoonDepartureTime?: string;
    afternoonArrivalTime?: string;
    vehicleId?: string;
  }) {
    const { data, error } = await supabase.rpc('create_transport_route', {
      p_school_id: route.schoolId,
      p_route_name: route.routeName,
      p_route_code: route.routeCode || null,
      p_stops: route.stops || [],
      p_morning_departure_time: route.morningDepartureTime || null,
      p_morning_arrival_time: route.morningArrivalTime || null,
      p_afternoon_departure_time: route.afternoonDepartureTime || null,
      p_afternoon_arrival_time: route.afternoonArrivalTime || null,
      p_vehicle_id: route.vehicleId || null,
    });

    if (error) throw error;
    return data;
  },

  async updateRoute(routeId: string, updates: Partial<TransportRoute>) {
    const { data, error } = await supabase
      .from('transport_routes')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', routeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Vínculos Aluno-Rota
  async getStudentAssignments(filters?: {
    studentId?: string;
    routeId?: string;
    schoolId?: string;
    academicYear?: number;
    activeOnly?: boolean;
  }) {
    let query = supabase
      .from('student_transport')
      .select(`
        id,
        student_id,
        route_id,
        academic_year,
        boarding_stop,
        disembarkation_stop,
        shift,
        is_active,
        start_date,
        end_date,
        created_at,
        updated_at,
        student:students!student_transport_student_id_fkey(name),
        route:transport_routes!student_transport_route_id_fkey(route_name)
      `)
      .order('created_at', { ascending: false });

    if (filters?.studentId) {
      query = query.eq('student_id', filters.studentId);
    }
    if (filters?.routeId) {
      query = query.eq('route_id', filters.routeId);
    }
    if (filters?.academicYear) {
      query = query.eq('academic_year', filters.academicYear);
    }
    if (filters?.activeOnly !== false) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as StudentTransport[];
  },

  async assignStudentToRoute(assignment: {
    studentId: string;
    routeId: string;
    academicYear: number;
    boardingStop?: string;
    disembarkationStop?: string;
    shift?: string;
    startDate?: string;
  }) {
    const { data, error } = await supabase.rpc('assign_student_to_route', {
      p_student_id: assignment.studentId,
      p_route_id: assignment.routeId,
      p_academic_year: assignment.academicYear,
      p_boarding_stop: assignment.boardingStop || null,
      p_disembarkation_stop: assignment.disembarkationStop || null,
      p_shift: assignment.shift || null,
      p_start_date: assignment.startDate || null,
    });

    if (error) throw error;
    return data;
  },

  async updateStudentAssignment(assignmentId: string, updates: Partial<StudentTransport>) {
    const { data, error } = await supabase
      .from('student_transport')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Controle de Acesso
  async getAttendance(filters?: {
    studentId?: string;
    routeId?: string;
    startDate?: string;
    endDate?: string;
    attendanceType?: string;
  }) {
    let query = supabase
      .from('transport_attendance')
      .select(`
        id,
        student_id,
        route_id,
        vehicle_id,
        attendance_date,
        attendance_time,
        attendance_type,
        latitude,
        longitude,
        verification_method,
        verification_code,
        status,
        recorded_by,
        created_at,
        student:students!transport_attendance_student_id_fkey(name),
        route:transport_routes!transport_attendance_route_id_fkey(route_name)
      `)
      .order('attendance_date', { ascending: false })
      .order('attendance_time', { ascending: false });

    if (filters?.studentId) {
      query = query.eq('student_id', filters.studentId);
    }
    if (filters?.routeId) {
      query = query.eq('route_id', filters.routeId);
    }
    if (filters?.startDate) {
      query = query.gte('attendance_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('attendance_date', filters.endDate);
    }
    if (filters?.attendanceType) {
      query = query.eq('attendance_type', filters.attendanceType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as TransportAttendance[];
  },

  async recordAttendance(attendance: {
    studentId: string;
    routeId: string;
    attendanceDate: string;
    attendanceTime: string;
    attendanceType: string;
    vehicleId?: string;
    verificationMethod?: string;
    verificationCode?: string;
    latitude?: number;
    longitude?: number;
  }) {
    const { data, error } = await supabase.rpc('record_transport_attendance', {
      p_student_id: attendance.studentId,
      p_route_id: attendance.routeId,
      p_attendance_date: attendance.attendanceDate,
      p_attendance_time: attendance.attendanceTime,
      p_attendance_type: attendance.attendanceType,
      p_vehicle_id: attendance.vehicleId || null,
      p_verification_method: attendance.verificationMethod || 'manual',
      p_verification_code: attendance.verificationCode || null,
      p_latitude: attendance.latitude || null,
      p_longitude: attendance.longitude || null,
    });

    if (error) throw error;
    return data;
  },
};

