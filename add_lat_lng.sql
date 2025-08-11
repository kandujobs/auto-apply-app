alter table profiles add column latitude double precision, add column longitude double precision;
-- Add columns for auto-apply usage tracking
alter table profiles add column if not exists auto_applies_used_today integer default 0;
alter table profiles add column if not exists auto_apply_usage_date date default current_date;
