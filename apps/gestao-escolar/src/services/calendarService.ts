import { supabase } from '@pei/database';

export interface CalendarEvent {
  date: string;
  type: 'class' | 'holiday' | 'recess' | 'event';
  description: string;
  name?: string;
}

export interface AcademicCalendar {
  id: string;
  school_id?: string;
  tenant_id: string;
  academic_year: number;
  calendar_data: any;
  school_days: CalendarEvent[];
  holidays: CalendarEvent[];
  recess_periods: any[];
  events: CalendarEvent[];
  total_school_days: number | null;
  total_instructional_hours: number | null;
}

export const calendarService = {
  async getCalendar(filters: {
    schoolId?: string;
    tenantId?: string;
    academicYear: number;
  }): Promise<AcademicCalendar | null> {
    const { data, error } = await supabase.rpc('get_academic_calendars', {
      p_school_id: filters.schoolId || null,
      p_tenant_id: filters.tenantId || null,
      p_academic_year: filters.academicYear,
    });

    if (error) throw error;
    return (data && data.length > 0) ? data[0] : null;
  },

  async isSchoolDay(date: string, calendar: AcademicCalendar | null): Promise<boolean> {
    if (!calendar) return true; // Se não há calendário, assume que é dia letivo

    const dateObj = new Date(date);
    const dateStr = date.split('T')[0];

    // Verificar se é feriado
    const isHoliday = (calendar.holidays || []).some(
      h => h.date === dateStr || h.date === date
    );
    if (isHoliday) return false;

    // Verificar se está em período de recesso
    const isRecess = (calendar.recess_periods || []).some((period: any) => {
      const start = new Date(period.start_date || period.startDate);
      const end = new Date(period.end_date || period.endDate);
      return dateObj >= start && dateObj <= end;
    });
    if (isRecess) return false;

    // Verificar se é dia letivo explícito
    const isExplicitSchoolDay = (calendar.school_days || []).some(
      d => (d.date === dateStr || d.date === date) && d.type === 'class'
    );
    if (isExplicitSchoolDay) return true;

    // Verificar se não é fim de semana
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return false; // Domingo ou Sábado

    // Por padrão, assume que é dia letivo se não for feriado ou recesso
    return true;
  },

  async getDayInfo(date: string, calendar: AcademicCalendar | null): Promise<{
    isSchoolDay: boolean;
    type: 'class' | 'holiday' | 'recess' | 'event' | 'weekend' | 'unknown';
    events: CalendarEvent[];
    description?: string;
  }> {
    if (!calendar) {
      return {
        isSchoolDay: true,
        type: 'class',
        events: [],
      };
    }

    const dateStr = date.split('T')[0];
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    // Verificar eventos do dia
    const dayEvents = [
      ...(calendar.holidays || []).filter(e => e.date === dateStr || e.date === date),
      ...(calendar.events || []).filter(e => e.date === dateStr || e.date === date),
      ...(calendar.school_days || []).filter(e => e.date === dateStr || e.date === date),
    ];

    // Verificar se é feriado
    const holiday = (calendar.holidays || []).find(
      h => h.date === dateStr || h.date === date
    );
    if (holiday) {
      return {
        isSchoolDay: false,
        type: 'holiday',
        events: dayEvents,
        description: holiday.name || holiday.description,
      };
    }

    // Verificar se está em período de recesso
    const recessPeriod = (calendar.recess_periods || []).find((period: any) => {
      const start = new Date(period.start_date || period.startDate);
      const end = new Date(period.end_date || period.endDate);
      return dateObj >= start && dateObj <= end;
    });
    if (recessPeriod) {
      return {
        isSchoolDay: false,
        type: 'recess',
        events: dayEvents,
        description: recessPeriod.name || recessPeriod.description,
      };
    }

    // Verificar se é fim de semana
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        isSchoolDay: false,
        type: 'weekend',
        events: dayEvents,
        description: dayOfWeek === 0 ? 'Domingo' : 'Sábado',
      };
    }

    // Verificar se há evento marcado
    const event = (calendar.events || []).find(
      e => e.date === dateStr || e.date === date
    );
    if (event) {
      return {
        isSchoolDay: true,
        type: 'event',
        events: dayEvents,
        description: event.name || event.description,
      };
    }

    // Dia letivo normal
    return {
      isSchoolDay: true,
      type: 'class',
      events: dayEvents,
    };
  },

  async getSchoolDaysCount(
    startDate: string,
    endDate: string,
    calendar: AcademicCalendar | null
  ): Promise<number> {
    if (!calendar) {
      // Contar dias úteis (segunda a sexta)
      const start = new Date(startDate);
      const end = new Date(endDate);
      let count = 0;
      const current = new Date(start);
      
      while (current <= end) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          count++;
        }
        current.setDate(current.getDate() + 1);
      }
      return count;
    }

    // Contar dias letivos considerando calendário
    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;
    const current = new Date(start);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const isSchoolDay = await this.isSchoolDay(dateStr || '', calendar);
      if (isSchoolDay) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  },
};

