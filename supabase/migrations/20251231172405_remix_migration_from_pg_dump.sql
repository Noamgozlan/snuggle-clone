CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'username'
  );
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: is_mentor_of(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_mentor_of(mentor_user_id uuid, student_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mentor_relationships 
    WHERE mentor_id = mentor_user_id 
    AND student_id = student_user_id 
    AND status = 'accepted'
  )
$$;


--
-- Name: lookup_user_id_by_username(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.lookup_user_id_by_username(p_username text) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select user_id
  from public.profiles
  where username ilike p_username
  limit 1;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: confirmations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.confirmations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    strategy_id uuid NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: feedback_replies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback_replies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    feedback_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: mentor_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mentor_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mentor_id uuid NOT NULL,
    student_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: mentor_relationships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mentor_relationships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mentor_id uuid NOT NULL,
    student_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT mentor_relationships_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])))
);


--
-- Name: mentor_trade_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mentor_trade_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mentor_id uuid NOT NULL,
    student_id uuid NOT NULL,
    trade_id uuid,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: portfolios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portfolios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    balance numeric DEFAULT 0 NOT NULL,
    drawdown numeric,
    profit_goal numeric,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email text,
    first_name text,
    last_name text,
    username text,
    country text,
    trading_style text DEFAULT 'auto'::text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    favorite_asset text,
    is_public boolean DEFAULT false NOT NULL,
    chart_colors jsonb DEFAULT '{"body_up": "#26a69a", "wick_up": "#26a69a", "body_down": "#ef5350", "border_up": "#26a69a", "wick_down": "#ef5350", "background": "#1e1e1e", "border_down": "#ef5350"}'::jsonb
);


--
-- Name: shared_trade_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shared_trade_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shared_trade_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: shared_trade_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shared_trade_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shared_trade_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: shared_trades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shared_trades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    symbol text NOT NULL,
    trade_type text NOT NULL,
    entry_price numeric(20,8) NOT NULL,
    exit_price numeric(20,8),
    pnl numeric(20,2),
    pnl_percentage numeric(10,2),
    strategy text,
    notes text,
    screenshot_url text,
    is_closed boolean DEFAULT false NOT NULL,
    trade_date timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT shared_trades_trade_type_check CHECK ((trade_type = ANY (ARRAY['long'::text, 'short'::text])))
);


--
-- Name: strategies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.strategies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: trade_confirmations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trade_confirmations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    trade_id uuid NOT NULL,
    confirmation_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: trades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    symbol text NOT NULL,
    trade_type text NOT NULL,
    quantity numeric(20,4) DEFAULT 1 NOT NULL,
    entry_date timestamp with time zone,
    exit_date timestamp with time zone,
    entry_price numeric(20,8) NOT NULL,
    exit_price numeric(20,8),
    pnl numeric(20,2),
    pnl_points numeric(20,4),
    risk numeric(20,2),
    commission numeric(20,2) DEFAULT 0,
    rating integer,
    strategy text,
    notes text,
    screenshot_url text,
    is_closed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    rr numeric,
    portfolio_id uuid,
    CONSTRAINT trades_rating_check CHECK (((rating >= 0) AND (rating <= 5))),
    CONSTRAINT trades_trade_type_check CHECK ((trade_type = ANY (ARRAY['long'::text, 'short'::text])))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: confirmations confirmations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.confirmations
    ADD CONSTRAINT confirmations_pkey PRIMARY KEY (id);


--
-- Name: feedback_replies feedback_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_replies
    ADD CONSTRAINT feedback_replies_pkey PRIMARY KEY (id);


--
-- Name: mentor_notes mentor_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentor_notes
    ADD CONSTRAINT mentor_notes_pkey PRIMARY KEY (id);


--
-- Name: mentor_relationships mentor_relationships_mentor_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentor_relationships
    ADD CONSTRAINT mentor_relationships_mentor_id_student_id_key UNIQUE (mentor_id, student_id);


--
-- Name: mentor_relationships mentor_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentor_relationships
    ADD CONSTRAINT mentor_relationships_pkey PRIMARY KEY (id);


--
-- Name: mentor_trade_feedback mentor_trade_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentor_trade_feedback
    ADD CONSTRAINT mentor_trade_feedback_pkey PRIMARY KEY (id);


--
-- Name: portfolios portfolios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolios
    ADD CONSTRAINT portfolios_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- Name: shared_trade_comments shared_trade_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_trade_comments
    ADD CONSTRAINT shared_trade_comments_pkey PRIMARY KEY (id);


--
-- Name: shared_trade_likes shared_trade_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_trade_likes
    ADD CONSTRAINT shared_trade_likes_pkey PRIMARY KEY (id);


--
-- Name: shared_trade_likes shared_trade_likes_shared_trade_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_trade_likes
    ADD CONSTRAINT shared_trade_likes_shared_trade_id_user_id_key UNIQUE (shared_trade_id, user_id);


--
-- Name: shared_trades shared_trades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_trades
    ADD CONSTRAINT shared_trades_pkey PRIMARY KEY (id);


--
-- Name: strategies strategies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strategies
    ADD CONSTRAINT strategies_pkey PRIMARY KEY (id);


--
-- Name: trade_confirmations trade_confirmations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trade_confirmations
    ADD CONSTRAINT trade_confirmations_pkey PRIMARY KEY (id);


--
-- Name: trades trades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_trade_confirmations_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trade_confirmations_name ON public.trade_confirmations USING btree (confirmation_name);


--
-- Name: idx_trade_confirmations_trade_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trade_confirmations_trade_id ON public.trade_confirmations USING btree (trade_id);


--
-- Name: mentor_notes update_mentor_notes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_mentor_notes_updated_at BEFORE UPDATE ON public.mentor_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: mentor_relationships update_mentor_relationships_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_mentor_relationships_updated_at BEFORE UPDATE ON public.mentor_relationships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: mentor_trade_feedback update_mentor_trade_feedback_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_mentor_trade_feedback_updated_at BEFORE UPDATE ON public.mentor_trade_feedback FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: portfolios update_portfolios_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON public.portfolios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: shared_trade_comments update_shared_trade_comments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_shared_trade_comments_updated_at BEFORE UPDATE ON public.shared_trade_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: shared_trades update_shared_trades_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_shared_trades_updated_at BEFORE UPDATE ON public.shared_trades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: strategies update_strategies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON public.strategies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: trades update_trades_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON public.trades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: confirmations confirmations_strategy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.confirmations
    ADD CONSTRAINT confirmations_strategy_id_fkey FOREIGN KEY (strategy_id) REFERENCES public.strategies(id) ON DELETE CASCADE;


--
-- Name: feedback_replies feedback_replies_feedback_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_replies
    ADD CONSTRAINT feedback_replies_feedback_id_fkey FOREIGN KEY (feedback_id) REFERENCES public.mentor_trade_feedback(id) ON DELETE CASCADE;


--
-- Name: mentor_trade_feedback mentor_trade_feedback_trade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentor_trade_feedback
    ADD CONSTRAINT mentor_trade_feedback_trade_id_fkey FOREIGN KEY (trade_id) REFERENCES public.trades(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: shared_trade_comments shared_trade_comments_shared_trade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_trade_comments
    ADD CONSTRAINT shared_trade_comments_shared_trade_id_fkey FOREIGN KEY (shared_trade_id) REFERENCES public.shared_trades(id) ON DELETE CASCADE;


--
-- Name: shared_trade_likes shared_trade_likes_shared_trade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_trade_likes
    ADD CONSTRAINT shared_trade_likes_shared_trade_id_fkey FOREIGN KEY (shared_trade_id) REFERENCES public.shared_trades(id) ON DELETE CASCADE;


--
-- Name: shared_trades shared_trades_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_trades
    ADD CONSTRAINT shared_trades_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: trade_confirmations trade_confirmations_trade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trade_confirmations
    ADD CONSTRAINT trade_confirmations_trade_id_fkey FOREIGN KEY (trade_id) REFERENCES public.trades(id) ON DELETE CASCADE;


--
-- Name: trades trades_portfolio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_portfolio_id_fkey FOREIGN KEY (portfolio_id) REFERENCES public.portfolios(id) ON DELETE SET NULL;


--
-- Name: trades trades_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: shared_trades Admins can delete any shared trades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete any shared trades" ON public.shared_trades FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: shared_trade_comments Anyone can view comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view comments" ON public.shared_trade_comments FOR SELECT USING (true);


--
-- Name: shared_trade_likes Anyone can view likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view likes" ON public.shared_trade_likes FOR SELECT USING (true);


--
-- Name: profiles Anyone can view public profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view public profiles" ON public.profiles FOR SELECT USING ((is_public = true));


--
-- Name: shared_trades Anyone can view shared trades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view shared trades" ON public.shared_trades FOR SELECT USING (true);


--
-- Name: mentor_notes Mentors and students can view notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Mentors and students can view notes" ON public.mentor_notes FOR SELECT USING (((auth.uid() = mentor_id) OR (auth.uid() = student_id)));


--
-- Name: mentor_trade_feedback Mentors and students can view their feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Mentors and students can view their feedback" ON public.mentor_trade_feedback FOR SELECT USING (((auth.uid() = mentor_id) OR (auth.uid() = student_id)));


--
-- Name: mentor_trade_feedback Mentors can create feedback for their students; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Mentors can create feedback for their students" ON public.mentor_trade_feedback FOR INSERT WITH CHECK (((auth.uid() = mentor_id) AND (EXISTS ( SELECT 1
   FROM public.mentor_relationships
  WHERE ((mentor_relationships.mentor_id = auth.uid()) AND (mentor_relationships.student_id = mentor_trade_feedback.student_id) AND (mentor_relationships.status = 'accepted'::text))))));


--
-- Name: mentor_notes Mentors can create notes for their students; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Mentors can create notes for their students" ON public.mentor_notes FOR INSERT WITH CHECK (((auth.uid() = mentor_id) AND (EXISTS ( SELECT 1
   FROM public.mentor_relationships
  WHERE ((mentor_relationships.mentor_id = auth.uid()) AND (mentor_relationships.student_id = mentor_notes.student_id) AND (mentor_relationships.status = 'accepted'::text))))));


--
-- Name: mentor_trade_feedback Mentors can delete their feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Mentors can delete their feedback" ON public.mentor_trade_feedback FOR DELETE USING ((auth.uid() = mentor_id));


--
-- Name: mentor_notes Mentors can delete their notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Mentors can delete their notes" ON public.mentor_notes FOR DELETE USING ((auth.uid() = mentor_id));


--
-- Name: mentor_relationships Mentors can update requests to them; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Mentors can update requests to them" ON public.mentor_relationships FOR UPDATE USING ((auth.uid() = mentor_id));


--
-- Name: mentor_trade_feedback Mentors can update their feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Mentors can update their feedback" ON public.mentor_trade_feedback FOR UPDATE USING ((auth.uid() = mentor_id));


--
-- Name: mentor_notes Mentors can update their notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Mentors can update their notes" ON public.mentor_notes FOR UPDATE USING ((auth.uid() = mentor_id));


--
-- Name: trade_confirmations Mentors can view students trade confirmations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Mentors can view students trade confirmations" ON public.trade_confirmations FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.trades
  WHERE ((trades.id = trade_confirmations.trade_id) AND public.is_mentor_of(auth.uid(), trades.user_id)))));


--
-- Name: portfolios Mentors can view their students portfolios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Mentors can view their students portfolios" ON public.portfolios FOR SELECT USING (public.is_mentor_of(auth.uid(), user_id));


--
-- Name: profiles Mentors can view their students profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Mentors can view their students profiles" ON public.profiles FOR SELECT USING (public.is_mentor_of(auth.uid(), user_id));


--
-- Name: trades Mentors can view their students trades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Mentors can view their students trades" ON public.trades FOR SELECT USING (public.is_mentor_of(auth.uid(), user_id));


--
-- Name: mentor_relationships Students can create mentor requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can create mentor requests" ON public.mentor_relationships FOR INSERT WITH CHECK ((auth.uid() = student_id));


--
-- Name: feedback_replies Students can create replies to their feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can create replies to their feedback" ON public.feedback_replies FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public.mentor_trade_feedback
  WHERE ((mentor_trade_feedback.id = feedback_replies.feedback_id) AND (mentor_trade_feedback.student_id = auth.uid()))))));


--
-- Name: mentor_relationships Students can delete their own requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can delete their own requests" ON public.mentor_relationships FOR DELETE USING ((auth.uid() = student_id));


--
-- Name: confirmations Users can create confirmations for their strategies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create confirmations for their strategies" ON public.confirmations FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.strategies
  WHERE ((strategies.id = confirmations.strategy_id) AND (strategies.user_id = auth.uid())))));


--
-- Name: shared_trade_comments Users can create their own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own comments" ON public.shared_trade_comments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: shared_trade_likes Users can create their own likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own likes" ON public.shared_trade_likes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: portfolios Users can create their own portfolios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own portfolios" ON public.portfolios FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: shared_trades Users can create their own shared trades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own shared trades" ON public.shared_trades FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: strategies Users can create their own strategies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own strategies" ON public.strategies FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: trade_confirmations Users can create their own trade confirmations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own trade confirmations" ON public.trade_confirmations FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.trades
  WHERE ((trades.id = trade_confirmations.trade_id) AND (trades.user_id = auth.uid())))));


--
-- Name: trades Users can create their own trades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own trades" ON public.trades FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: confirmations Users can delete confirmations of their strategies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete confirmations of their strategies" ON public.confirmations FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.strategies
  WHERE ((strategies.id = confirmations.strategy_id) AND (strategies.user_id = auth.uid())))));


--
-- Name: shared_trade_comments Users can delete their own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own comments" ON public.shared_trade_comments FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: shared_trade_likes Users can delete their own likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own likes" ON public.shared_trade_likes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: portfolios Users can delete their own portfolios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own portfolios" ON public.portfolios FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: feedback_replies Users can delete their own replies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own replies" ON public.feedback_replies FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: shared_trades Users can delete their own shared trades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own shared trades" ON public.shared_trades FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: strategies Users can delete their own strategies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own strategies" ON public.strategies FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: trade_confirmations Users can delete their own trade confirmations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own trade confirmations" ON public.trade_confirmations FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.trades
  WHERE ((trades.id = trade_confirmations.trade_id) AND (trades.user_id = auth.uid())))));


--
-- Name: trades Users can delete their own trades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own trades" ON public.trades FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: shared_trade_comments Users can update their own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own comments" ON public.shared_trade_comments FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: portfolios Users can update their own portfolios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own portfolios" ON public.portfolios FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: shared_trades Users can update their own shared trades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own shared trades" ON public.shared_trades FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: strategies Users can update their own strategies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own strategies" ON public.strategies FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: trades Users can update their own trades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own trades" ON public.trades FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: confirmations Users can view confirmations of their strategies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view confirmations of their strategies" ON public.confirmations FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.strategies
  WHERE ((strategies.id = confirmations.strategy_id) AND (strategies.user_id = auth.uid())))));


--
-- Name: feedback_replies Users can view replies to their feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view replies to their feedback" ON public.feedback_replies FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.mentor_trade_feedback
  WHERE ((mentor_trade_feedback.id = feedback_replies.feedback_id) AND ((mentor_trade_feedback.student_id = auth.uid()) OR (mentor_trade_feedback.mentor_id = auth.uid()))))));


--
-- Name: mentor_relationships Users can view their own mentor relationships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own mentor relationships" ON public.mentor_relationships FOR SELECT USING (((auth.uid() = mentor_id) OR (auth.uid() = student_id)));


--
-- Name: portfolios Users can view their own portfolios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own portfolios" ON public.portfolios FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: strategies Users can view their own strategies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own strategies" ON public.strategies FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: trade_confirmations Users can view their own trade confirmations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own trade confirmations" ON public.trade_confirmations FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.trades
  WHERE ((trades.id = trade_confirmations.trade_id) AND (trades.user_id = auth.uid())))));


--
-- Name: trades Users can view their own trades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own trades" ON public.trades FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: confirmations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.confirmations ENABLE ROW LEVEL SECURITY;

--
-- Name: feedback_replies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feedback_replies ENABLE ROW LEVEL SECURITY;

--
-- Name: mentor_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mentor_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: mentor_relationships; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mentor_relationships ENABLE ROW LEVEL SECURITY;

--
-- Name: mentor_trade_feedback; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mentor_trade_feedback ENABLE ROW LEVEL SECURITY;

--
-- Name: portfolios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: shared_trade_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shared_trade_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: shared_trade_likes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shared_trade_likes ENABLE ROW LEVEL SECURITY;

--
-- Name: shared_trades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shared_trades ENABLE ROW LEVEL SECURITY;

--
-- Name: strategies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;

--
-- Name: trade_confirmations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trade_confirmations ENABLE ROW LEVEL SECURITY;

--
-- Name: trades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;