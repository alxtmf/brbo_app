-- удаление отправленных и неотправленных сообщений
create function public.delete_sent_messages(threshold integer)
returns bigint
as $$
    WITH deleted AS (delete from public.reg_sent_message rsm
        where rsm.status = 1
                  and (EXTRACT(EPOCH FROM current_timestamp) - EXTRACT(EPOCH FROM date_create))/3600 > delete_sent_messages.threshold RETURNING *
        ) SELECT count(*) FROM deleted;
$$ language sql volatile strict security definer;

create function public.delete_no_sent_messages(threshold integer)
returns bigint
as $$
    WITH deleted AS (delete from public.reg_sent_message rsm
        where rsm.status in (2, 3)
                  and (date(current_timestamp) - date_create::date) > delete_no_sent_messages.threshold RETURNING *
        ) SELECT count(*) FROM deleted;
$$ language sql volatile strict security definer;


--5.2.4. Удаление обработанных запросов

create function public.delete_sent_requests(threshold integer)
returns bigint
as $$
    WITH deleted AS (delete from public.reg_incom_request rir
        where rir.status = 3
            and (EXTRACT(EPOCH FROM current_timestamp) - EXTRACT(EPOCH FROM date_create))/3600 > delete_sent_requests.threshold RETURNING *
        ) SELECT count(*) FROM deleted;
$$ language sql volatile strict security definer;

create function public.delete_no_sent_requests(threshold integer)
returns bigint
as $$
    WITH deleted AS (delete from public.reg_incom_request rir
        where rir.status = 2
            and (date(current_timestamp) - date_create::date) > delete_no_sent_requests.threshold RETURNING *
        ) SELECT count(*) FROM deleted;
$$ language sql volatile strict security definer;

create function public.delete_read_requests(threshold integer)
returns bigint
as $$
    WITH deleted AS (delete from public.reg_incom_request rir
        where rir.status = 1
            and (date(current_timestamp) - date_create::date) > delete_read_requests.threshold RETURNING *
        ) SELECT count(*) FROM deleted;
$$ language sql volatile strict security definer;

