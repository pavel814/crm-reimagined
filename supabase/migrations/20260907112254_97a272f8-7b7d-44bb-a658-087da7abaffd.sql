CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace text;
  new_name text;
BEGIN
  new_name := COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'display_name', ''), split_part(COALESCE(NEW.email, ''), '@', 1));
  new_workspace := COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'workspace_name', ''), 'Моя команда');

  INSERT INTO public.profiles (id, display_name, workspace_name)
  VALUES (NEW.id, new_name, new_workspace)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.services (owner_id, name, description, duration_minutes, price, specialist_name, location, is_public)
  VALUES (NEW.id, 'Первичная консультация', 'Знакомство, постановка целей и план занятий', 60, 50, new_name, 'Студия', true);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();