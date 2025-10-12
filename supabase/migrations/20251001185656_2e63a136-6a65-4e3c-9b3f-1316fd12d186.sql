-- Create pei_history table to track all changes
CREATE TABLE public.pei_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pei_id UUID NOT NULL REFERENCES public.peis(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  change_type TEXT NOT NULL, -- 'created', 'updated', 'status_changed'
  diagnosis_data JSONB,
  planning_data JSONB,
  evaluation_data JSONB,
  status pei_status,
  change_summary TEXT,
  UNIQUE(pei_id, version_number)
);

-- Enable RLS
ALTER TABLE public.pei_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pei_history
CREATE POLICY "Users can view history of accessible PEIs"
ON public.pei_history
FOR SELECT
USING (
  pei_id IN (
    SELECT id FROM peis 
    WHERE assigned_teacher_id = auth.uid() 
    OR created_by = auth.uid()
    OR tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() AND role IN ('coordinator', 'superadmin')
    )
  )
);

CREATE POLICY "System can insert history"
ON public.pei_history
FOR INSERT
WITH CHECK (true);

-- Create function to automatically version PEI changes
CREATE OR REPLACE FUNCTION public.create_pei_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_version INTEGER;
  change_type TEXT;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO next_version
  FROM pei_history
  WHERE pei_id = NEW.id;

  -- Determine change type
  IF TG_OP = 'INSERT' THEN
    change_type := 'created';
  ELSIF OLD.status != NEW.status THEN
    change_type := 'status_changed';
  ELSE
    change_type := 'updated';
  END IF;

  -- Insert history record
  INSERT INTO public.pei_history (
    pei_id,
    version_number,
    changed_by,
    changed_at,
    change_type,
    diagnosis_data,
    planning_data,
    evaluation_data,
    status,
    change_summary
  ) VALUES (
    NEW.id,
    next_version,
    COALESCE(auth.uid(), NEW.created_by),
    NOW(),
    change_type,
    NEW.diagnosis_data,
    NEW.planning_data,
    NEW.evaluation_data,
    NEW.status,
    CASE 
      WHEN change_type = 'created' THEN 'PEI criado'
      WHEN change_type = 'status_changed' THEN 'Status alterado de ' || OLD.status || ' para ' || NEW.status
      ELSE 'PEI atualizado'
    END
  );

  RETURN NEW;
END;
$$;

-- Create trigger to track PEI changes
CREATE TRIGGER track_pei_changes
AFTER INSERT OR UPDATE ON public.peis
FOR EACH ROW
EXECUTE FUNCTION public.create_pei_version();

-- Create index for better query performance
CREATE INDEX idx_pei_history_pei_id ON public.pei_history(pei_id);
CREATE INDEX idx_pei_history_changed_at ON public.pei_history(changed_at DESC);