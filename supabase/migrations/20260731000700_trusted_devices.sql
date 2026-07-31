CREATE TABLE IF NOT EXISTS public.auth_devices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id text NOT NULL,
    browser text,
    os text,
    last_ip text,
    trust_score int DEFAULT 0,
    is_trusted boolean DEFAULT false,
    last_active_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    UNIQUE (user_id, device_id)
);

-- Enable RLS
ALTER TABLE public.auth_devices ENABLE ROW LEVEL SECURITY;

-- Users can view their own devices
CREATE POLICY "Users can view their own devices"
    ON public.auth_devices FOR SELECT
    USING (auth.uid() = user_id);

-- RPC to register a trusted device securely
CREATE OR REPLACE FUNCTION public.register_trusted_device(
    p_device_id text,
    p_browser text,
    p_os text
) RETURNS jsonb AS $$
DECLARE
    v_user_id uuid;
    v_ip text;
BEGIN
    -- Securely get current authenticated user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- Extract IP securely from Supabase headers
    v_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
    IF v_ip IS NULL THEN
        v_ip := 'Unknown';
    ELSE
        -- x-forwarded-for can be a comma-separated list, take the first one
        v_ip := split_part(v_ip, ',', 1);
    END IF;

    -- Upsert the device footprint
    INSERT INTO public.auth_devices (
        user_id, device_id, browser, os, last_ip, last_active_at
    ) VALUES (
        v_user_id, p_device_id, p_browser, p_os, v_ip, now()
    )
    ON CONFLICT (user_id, device_id)
    DO UPDATE SET
        browser = EXCLUDED.browser,
        os = EXCLUDED.os,
        last_ip = EXCLUDED.last_ip,
        last_active_at = now(),
        -- Optionally bump trust score on successful re-authentication from same IP
        trust_score = CASE 
            WHEN auth_devices.last_ip = EXCLUDED.last_ip THEN LEAST(auth_devices.trust_score + 10, 100)
            ELSE GREATEST(auth_devices.trust_score - 20, 0)
        END;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
