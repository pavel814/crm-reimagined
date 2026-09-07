INSERT INTO public.services (owner_id, name, description, duration_minutes, price, specialist_name, location, is_public)
VALUES ('00000000-0000-0000-0000-000000000000', 'Первичная консультация', 'Знакомство, оценка запроса и план следующих занятий', 60, 50, 'Свободный специалист', 'Студия / онлайн', true)
ON CONFLICT DO NOTHING;