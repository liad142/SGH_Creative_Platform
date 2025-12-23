-- Database Schema Plan

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users Table (Extends Supabase Auth)
create table public.users (
  id uuid references auth.users not null primary key,
  username text unique,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seasons Table
create table public.seasons (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  theme text,
  active boolean default false
);

-- Generations Table (AI Assets)
create table public.generations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  prompt text not null,
  image_url text,
  status text default 'pending', -- pending, completed, failed
  meta jsonb, -- store generation params
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Cards Table (Collectibles)
create table public.cards (
  id uuid default uuid_generate_v4() primary key,
  season_id uuid references public.seasons(id),
  name text not null,
  description text,
  image_url text not null,
  rarity text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Pets Table
create table public.pets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  name text not null,
  type text not null, -- cat, dog, dragon, etc
  attributes jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Storage Buckets Setup (Instructions)
-- Create a public bucket named 'assets'
