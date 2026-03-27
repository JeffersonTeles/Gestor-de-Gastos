create or replace function public.clear_user_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  deleted_transactions integer := 0;
  deleted_budgets integer := 0;
  deleted_categories integer := 0;
  deleted_goals integer := 0;
  deleted_usage_events integer := 0;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  delete from public.transactions where user_id = current_user_id;
  get diagnostics deleted_transactions = row_count;

  delete from public.category_budgets where user_id = current_user_id;
  get diagnostics deleted_budgets = row_count;

  delete from public.categories where user_id = current_user_id;
  get diagnostics deleted_categories = row_count;

  delete from public.goals where user_id = current_user_id;
  get diagnostics deleted_goals = row_count;

  delete from public.usage_events where user_id = current_user_id;
  get diagnostics deleted_usage_events = row_count;

  return jsonb_build_object(
    'user_id', current_user_id,
    'transactions', deleted_transactions,
    'category_budgets', deleted_budgets,
    'categories', deleted_categories,
    'goals', deleted_goals,
    'usage_events', deleted_usage_events
  );
end;
$$;

grant execute on function public.clear_user_data() to authenticated;
