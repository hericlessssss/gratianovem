-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for admin management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    display_name TEXT,
    email TEXT,
    is_anonymous BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create novenas table
CREATE TABLE public.novenas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    title_pt TEXT,
    description TEXT,
    description_pt TEXT,
    cover_image_url TEXT,
    duration INTEGER NOT NULL DEFAULT 9,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create novena_days table
CREATE TABLE public.novena_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novena_id UUID REFERENCES public.novenas(id) ON DELETE CASCADE NOT NULL,
    day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 9),
    title TEXT NOT NULL,
    title_pt TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (novena_id, day_number)
);

-- Create day_content_blocks table
CREATE TABLE public.day_content_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novena_day_id UUID REFERENCES public.novena_days(id) ON DELETE CASCADE NOT NULL,
    block_type TEXT NOT NULL CHECK (block_type IN ('paragraph', 'prayer', 'quote', 'intention')),
    content TEXT NOT NULL,
    content_pt TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create day_checklist_items table
CREATE TABLE public.day_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novena_day_id UUID REFERENCES public.novena_days(id) ON DELETE CASCADE NOT NULL,
    label TEXT NOT NULL,
    label_pt TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_novena_runs table for tracking user progress
CREATE TABLE public.user_novena_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    novena_id UUID REFERENCES public.novenas(id) ON DELETE CASCADE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_day_progress table
CREATE TABLE public.user_day_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.user_novena_runs(id) ON DELETE CASCADE NOT NULL,
    day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 9),
    checklist_state JSONB DEFAULT '{}',
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (run_id, day_number)
);

-- Create testimonials table
CREATE TABLE public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    display_name TEXT NOT NULL,
    title TEXT,
    body TEXT NOT NULL CHECK (char_length(body) <= 1000),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novena_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_novena_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_day_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, is_anonymous, display_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.email IS NULL,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', 'Peregrino')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for novenas (public read, admin write)
CREATE POLICY "Anyone can view active novenas" ON public.novenas
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage novenas" ON public.novenas
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for novena_days (public read for active novenas)
CREATE POLICY "Anyone can view novena days" ON public.novena_days
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.novenas 
    WHERE id = novena_id AND is_active = true
  )
);

CREATE POLICY "Admins can manage novena days" ON public.novena_days
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for day_content_blocks
CREATE POLICY "Anyone can view content blocks" ON public.day_content_blocks
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.novena_days nd
    JOIN public.novenas n ON n.id = nd.novena_id
    WHERE nd.id = novena_day_id AND n.is_active = true
  )
);

CREATE POLICY "Admins can manage content blocks" ON public.day_content_blocks
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for day_checklist_items
CREATE POLICY "Anyone can view checklist items" ON public.day_checklist_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.novena_days nd
    JOIN public.novenas n ON n.id = nd.novena_id
    WHERE nd.id = novena_day_id AND n.is_active = true
  )
);

CREATE POLICY "Admins can manage checklist items" ON public.day_checklist_items
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_novena_runs
CREATE POLICY "Users can view their own runs" ON public.user_novena_runs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own runs" ON public.user_novena_runs
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own runs" ON public.user_novena_runs
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all runs" ON public.user_novena_runs
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_day_progress
CREATE POLICY "Users can view their own progress" ON public.user_day_progress
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_novena_runs 
    WHERE id = run_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own progress" ON public.user_day_progress
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_novena_runs 
    WHERE id = run_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own progress" ON public.user_day_progress
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_novena_runs 
    WHERE id = run_id AND user_id = auth.uid()
  )
);

-- RLS Policies for testimonials
CREATE POLICY "Anyone can view approved testimonials" ON public.testimonials
FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can create testimonials" ON public.testimonials
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own testimonials" ON public.testimonials
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all testimonials" ON public.testimonials
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_novenas_updated_at
  BEFORE UPDATE ON public.novenas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_novena_days_updated_at
  BEFORE UPDATE ON public.novena_days
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_day_progress_updated_at
  BEFORE UPDATE ON public.user_day_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();