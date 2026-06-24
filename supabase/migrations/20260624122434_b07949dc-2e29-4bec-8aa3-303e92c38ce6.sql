CREATE OR REPLACE FUNCTION public.get_public_profile(_user_id uuid)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  username text,
  avatar_url text,
  professional_title text,
  bio text,
  skills text[],
  experience text,
  languages text[],
  education text,
  occupation text,
  interests text[],
  learning_goals text,
  teaching_interests text,
  city text,
  country text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.first_name, p.last_name, p.username, p.avatar_url,
         p.professional_title, p.bio, p.skills, p.experience, p.languages,
         p.education, p.occupation, p.interests, p.learning_goals,
         p.teaching_interests, p.city, p.country
  FROM public.profiles p
  WHERE p.id = _user_id
    AND p.status = 'approved';
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated;