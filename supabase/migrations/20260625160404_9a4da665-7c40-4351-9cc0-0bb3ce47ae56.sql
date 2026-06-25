
-- Admin audit logs table
CREATE TABLE public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  target_user_id uuid,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only the hardcoded admin email can read; inserts handled server-side via service role
CREATE POLICY "Admin can view audit logs"
ON public.admin_audit_logs FOR SELECT
TO authenticated
USING ((auth.jwt() ->> 'email') = 'makolabdo@gmail.com');
