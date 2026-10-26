-- Retire public fan accounts, profiles, favourites, predictions and voting.
-- Personal/profile and fan-submitted data in these tables is intentionally
-- removed as part of the product change. Administrator roles remain.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop function if exists public.poll_results();
drop function if exists public.match_prediction_summary();
drop function if exists public.prediction_leaderboard();

drop table if exists public.poll_votes;
drop table if exists public.poll_options;
drop table if exists public.polls;
drop table if exists public.match_predictions;
drop table if exists public.favorite_teams;
drop table if exists public.favorite_players;
drop table if exists public.saved_matches;
drop table if exists public.user_profiles;
