-- Add exam_id to reports table to link reports to exams
ALTER TABLE public.reports
ADD COLUMN exam_id uuid REFERENCES public.exams(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_reports_exam_id ON public.reports(exam_id);