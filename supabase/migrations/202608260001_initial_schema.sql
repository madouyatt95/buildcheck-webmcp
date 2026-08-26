-- BuildCheck initial schema
-- Apply with the Supabase CLI after linking a project. The demo runtime does not require it.

create extension if not exists pgcrypto;

create type public.project_status as enum ('draft', 'analyzing', 'build', 'validate', 'pivot', 'kill', 'archived');
create type public.market_type as enum ('B2B', 'B2C', 'B2B2C');
create type public.verdict as enum ('BUILD', 'VALIDATE FIRST', 'PIVOT', 'KILL');
create type public.signal_type as enum (
  'pain', 'demand', 'willingness_to_pay', 'competitor_complaint', 'workaround',
  'feature_request', 'churn_risk', 'distribution', 'market_growth'
);
create type public.signal_strength as enum ('weak', 'moderate', 'strong');
create type public.signal_sentiment as enum ('negative', 'neutral', 'positive');
create type public.evidence_provenance as enum ('observed', 'inferred', 'generated');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  build_types text[] not null default '{}',
  main_goal text,
  ai_provider text not null default 'mock',
  data_source_provider text not null default 'mock',
  notifications jsonb not null default '{"analysis_complete": true, "score_changes": false}'::jsonb,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  slug text not null,
  description text not null check (char_length(description) <= 3000),
  problem text not null default '',
  target_customer text not null default '',
  business_model text not null default '',
  geography text not null default 'Global',
  market_type public.market_type not null default 'B2B',
  status public.project_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, slug)
);

create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  version integer not null check (version > 0),
  build_score integer not null check (build_score between 0 and 100),
  verdict public.verdict not null,
  confidence_score integer not null check (confidence_score between 0 and 100),
  summary text not null,
  provider_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (project_id, version)
);

create table public.analysis_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  dimension text not null check (dimension in ('demand', 'pain', 'willingnessToPay', 'distribution', 'competitionOpportunity', 'buildSimplicity', 'defensibility')),
  score numeric(3,1) not null check (score between 0 and 10),
  max_points integer not null check (max_points > 0),
  weighted_points numeric(4,1) not null check (weighted_points >= 0 and weighted_points <= max_points),
  justification text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (analysis_id, dimension)
);

create table public.market_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  source text not null,
  source_url text,
  title text not null,
  excerpt text not null,
  signal_type public.signal_type not null,
  strength public.signal_strength not null,
  sentiment public.signal_sentiment not null default 'neutral',
  provenance public.evidence_provenance not null default 'observed',
  reliability numeric(3,2) not null default 0.50 check (reliability between 0 and 1),
  is_demo boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  collected_at timestamptz not null
);

create table public.competitors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  name text not null,
  url text,
  positioning text not null default '',
  pricing text not null default '',
  target_audience text not null default '',
  strengths text[] not null default '{}',
  weaknesses text[] not null default '{}',
  opportunity text not null default '',
  is_demo boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.pivots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  concept text not null,
  target_audience text not null,
  why_stronger text not null,
  estimated_score integer not null check (estimated_score between 0 and 100),
  key_difference text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.mvp_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  scope text not null,
  features_include text[] not null default '{}',
  features_exclude text[] not null default '{}',
  test_hypothesis text not null,
  success_metrics text[] not null default '{}',
  estimated_hours text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (analysis_id)
);

create table public.agent_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  analysis_id uuid references public.analyses(id) on delete set null,
  tool text not null check (char_length(tool) between 1 and 128),
  duration_ms integer not null check (duration_ms >= 0),
  success boolean not null,
  error_code text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  problem text not null,
  audience text not null,
  category text not null,
  market_type public.market_type not null,
  opportunity_score integer not null check (opportunity_score between 0 and 100),
  pain_score numeric(3,1) not null check (pain_score between 0 and 10),
  demand_score numeric(3,1) not null check (demand_score between 0 and 10),
  competition_score numeric(3,1) not null check (competition_score between 0 and 10),
  complexity_score numeric(3,1) not null check (complexity_score between 0 and 10),
  pricing_min integer not null check (pricing_min >= 0),
  pricing_max integer not null check (pricing_max >= pricing_min),
  evidence_count integer not null default 0 check (evidence_count >= 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_demo boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index projects_user_updated_idx on public.projects (user_id, updated_at desc);
create index analyses_project_created_idx on public.analyses (project_id, created_at desc);
create index analysis_scores_analysis_idx on public.analysis_scores (analysis_id);
create index market_signals_project_type_idx on public.market_signals (project_id, signal_type);
create index market_signals_analysis_idx on public.market_signals (analysis_id);
create index competitors_project_idx on public.competitors (project_id);
create index pivots_analysis_idx on public.pivots (analysis_id);
create index agent_activity_user_created_idx on public.agent_activity (user_id, created_at desc);
create index opportunities_feed_idx on public.opportunities (status, opportunity_score desc);

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger preferences_set_updated_at before update on public.user_preferences for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger mvp_set_updated_at before update on public.mvp_recommendations for each row execute function public.set_updated_at();
create trigger opportunities_set_updated_at before update on public.opportunities for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'first_name', ''));
  insert into public.user_preferences (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.projects enable row level security;
alter table public.analyses enable row level security;
alter table public.analysis_scores enable row level security;
alter table public.market_signals enable row level security;
alter table public.competitors enable row level security;
alter table public.pivots enable row level security;
alter table public.mvp_recommendations enable row level security;
alter table public.agent_activity enable row level security;
alter table public.opportunities enable row level security;

create policy "profiles_select_own" on public.profiles for select using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "preferences_select_own" on public.user_preferences for select using ((select auth.uid()) = user_id);
create policy "preferences_update_own" on public.user_preferences for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "projects_select_own" on public.projects for select using ((select auth.uid()) = user_id);
create policy "projects_insert_own" on public.projects for insert with check ((select auth.uid()) = user_id);
create policy "projects_update_own" on public.projects for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "projects_delete_own" on public.projects for delete using ((select auth.uid()) = user_id);

-- Analyses and their evidence are append-only for authenticated clients.
create policy "analyses_select_own" on public.analyses for select using ((select auth.uid()) = user_id);
create policy "analyses_insert_own" on public.analyses for insert with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.projects parent
    where parent.id = analyses.project_id and parent.user_id = (select auth.uid())
  )
);
create policy "scores_select_own" on public.analysis_scores for select using ((select auth.uid()) = user_id);
create policy "scores_insert_own" on public.analysis_scores for insert with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.analyses parent
    where parent.id = analysis_scores.analysis_id and parent.user_id = (select auth.uid())
  )
);
create policy "signals_select_own" on public.market_signals for select using ((select auth.uid()) = user_id);
create policy "signals_insert_own" on public.market_signals for insert with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.analyses parent
    where parent.id = market_signals.analysis_id
      and parent.project_id = market_signals.project_id
      and parent.user_id = (select auth.uid())
  )
);
create policy "competitors_select_own" on public.competitors for select using ((select auth.uid()) = user_id);
create policy "competitors_insert_own" on public.competitors for insert with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.analyses parent
    where parent.id = competitors.analysis_id
      and parent.project_id = competitors.project_id
      and parent.user_id = (select auth.uid())
  )
);
create policy "pivots_select_own" on public.pivots for select using ((select auth.uid()) = user_id);
create policy "pivots_insert_own" on public.pivots for insert with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.analyses parent
    where parent.id = pivots.analysis_id
      and parent.project_id = pivots.project_id
      and parent.user_id = (select auth.uid())
  )
);
create policy "mvp_select_own" on public.mvp_recommendations for select using ((select auth.uid()) = user_id);
create policy "mvp_insert_own" on public.mvp_recommendations for insert with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.analyses parent
    where parent.id = mvp_recommendations.analysis_id
      and parent.project_id = mvp_recommendations.project_id
      and parent.user_id = (select auth.uid())
  )
);
create policy "mvp_update_own" on public.mvp_recommendations for update
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.analyses parent
      where parent.id = mvp_recommendations.analysis_id
        and parent.project_id = mvp_recommendations.project_id
        and parent.user_id = (select auth.uid())
    )
  );
create policy "agent_activity_select_own" on public.agent_activity for select using ((select auth.uid()) = user_id);
create policy "agent_activity_insert_own" on public.agent_activity for insert with check (
  (select auth.uid()) = user_id
  and (
    agent_activity.project_id is null
    or exists (
      select 1 from public.projects parent
      where parent.id = agent_activity.project_id and parent.user_id = (select auth.uid())
    )
  )
  and (
    agent_activity.analysis_id is null
    or exists (
      select 1 from public.analyses parent
      where parent.id = agent_activity.analysis_id
        and parent.user_id = (select auth.uid())
        and (agent_activity.project_id is null or parent.project_id = agent_activity.project_id)
    )
  )
);

create policy "published_opportunities_are_public" on public.opportunities for select using (status = 'published');

insert into public.opportunities (
  id, title, slug, description, problem, audience, category, market_type,
  opportunity_score, pain_score, demand_score, competition_score, complexity_score,
  pricing_min, pricing_max, evidence_count, status, is_demo
) values
  ('10000000-0000-4000-8000-000000000001', 'Refund exception desk for small Shopify stores', 'refund-exception-desk', 'A focused operations layer for delayed, partial and failed refunds.', 'Support teams cannot see which approved refunds are actually stuck.', 'Shopify stores with 2–10 support agents', 'Ecommerce', 'B2B', 86, 9.1, 8.4, 5.4, 2.8, 29, 79, 124, 'published', true),
  ('10000000-0000-4000-8000-000000000002', 'Compliance handover packs for solar installers', 'solar-handover-packs', 'Generate customer and regulator-ready evidence packs from field photos and checklists.', 'Small installers lose hours assembling inconsistent project handovers.', 'Independent solar installation teams', 'Productivity', 'B2B', 82, 8.7, 7.9, 3.2, 5.1, 49, 149, 91, 'published', true),
  ('10000000-0000-4000-8000-000000000003', 'Scope-creep ledger for product agencies', 'scope-creep-ledger', 'Turn client requests into an auditable margin and change-order workflow.', 'Small agencies discover unbilled work only after project margin has disappeared.', 'Digital product agencies with 5–30 people', 'Finance', 'B2B', 79, 8.8, 7.3, 5.7, 3.4, 39, 99, 76, 'published', true);
