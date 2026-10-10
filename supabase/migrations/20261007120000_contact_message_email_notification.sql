-- Portfolio — contact form email notification.
--
-- The browser still inserts into `contact_messages` exactly as it did before; this only
-- adds an AFTER INSERT trigger that queues an HTTP request with pg_net. pg_net runs the
-- request after the transaction, outside it, so:
--
--   * a message is saved even if the Edge Function or the email provider is down, and
--   * a slow email provider can never hold up the visitor's submit button.
--
-- No credential appears anywhere in this file. The trigger sends the row, and the
-- `contact-notify` Edge Function reads the message back from the database with the secret
-- key it keeps in its own environment. That also means the function cannot be talked into
-- emailing content someone made up: a caller can only point at a row that already exists.

create extension if not exists pg_net;

create or replace function public.contact_messages_notify_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  payload jsonb;
begin
  payload := jsonb_build_object(
    'type', 'INSERT',
    'schema', 'public',
    'table', 'contact_messages',
    'record', to_jsonb(new),
    'old_record', null
  );

  perform net.http_post(
    url := 'https://utncrpncpehtscbuygvp.supabase.co/functions/v1/contact-notify',
    body := payload,
    params := null,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 5000
  );

  return new;
end;
$$;

comment on function public.contact_messages_notify_email() is
  'AFTER INSERT trigger that queues an email to the owner via the contact-notify Edge Function.';

-- `security definer` so the network call runs with this function's owner and does not
-- depend on whatever rights `anon` happens to hold over `net.http_post`.
drop trigger if exists contact_messages_notify_email on public.contact_messages;
create trigger contact_messages_notify_email
  after insert on public.contact_messages
  for each row execute function public.contact_messages_notify_email();

-- Same treatment as the other internal trigger functions: the trigger needs it, the roles
-- that write to the table must not be able to call it directly. `public` is exposed by the
-- Data API, so this revoke is what keeps the function off the anonymous REST surface.
revoke all on function public.contact_messages_notify_email() from public, anon, authenticated;
