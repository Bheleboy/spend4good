COMMENT ON TABLE public.organizations IS 'Core organization table - schema cache reload trigger';
COMMENT ON COLUMN public.organizations.subscription_plan IS 'Active subscription plan ID';
COMMENT ON COLUMN public.organizations.subscription_tier IS 'Subscription tier level';
NOTIFY pgrst, 'reload schema';