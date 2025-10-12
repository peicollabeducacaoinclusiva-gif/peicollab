-- Update profiles table to set is_active default to false for new users
ALTER TABLE public.profiles ALTER COLUMN is_active SET DEFAULT false;

-- Create a table to track tutorial completion
CREATE TABLE public.user_tutorial_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutorial_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_tutorial_status
ALTER TABLE public.user_tutorial_status ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own tutorial status
CREATE POLICY "Users can view own tutorial status"
ON public.user_tutorial_status
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own tutorial status
CREATE POLICY "Users can insert own tutorial status"
ON public.user_tutorial_status
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tutorial status
CREATE POLICY "Users can update own tutorial status"
ON public.user_tutorial_status
FOR UPDATE
USING (auth.uid() = user_id);

-- Create a table for PEI notifications
CREATE TABLE public.pei_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pei_id UUID NOT NULL REFERENCES public.peis(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on pei_notifications
ALTER TABLE public.pei_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.pei_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications
CREATE POLICY "Users can update own notifications"
ON public.pei_notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Function to create notifications when PEI is updated
CREATE OR REPLACE FUNCTION public.notify_pei_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Notify assigned teacher
  IF NEW.assigned_teacher_id IS NOT NULL THEN
    INSERT INTO public.pei_notifications (user_id, pei_id, notification_type)
    VALUES (NEW.assigned_teacher_id, NEW.id, 'pei_updated');
  END IF;
  
  -- Notify coordinators of the same tenant
  INSERT INTO public.pei_notifications (user_id, pei_id, notification_type)
  SELECT p.id, NEW.id, 'pei_updated'
  FROM public.profiles p
  WHERE p.tenant_id = NEW.tenant_id 
    AND p.role = 'coordinator'
    AND p.id != auth.uid();
  
  RETURN NEW;
END;
$$;

-- Trigger to create notifications on PEI updates
CREATE TRIGGER on_pei_updated
AFTER UPDATE ON public.peis
FOR EACH ROW
WHEN (OLD.updated_at IS DISTINCT FROM NEW.updated_at)
EXECUTE FUNCTION public.notify_pei_update();