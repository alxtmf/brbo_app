create or replace view v_messenger_user_message_route(id_bot, id_user, id_messenger, id_event_type, id_target_system, id_parent_event_type, outer_id, user_settings, bot_name, bot_settings, messenger_code) as
SELECT mr.id_bot,
       mr.id_user,
       mr.id_messenger,
       mr.id_event_type,
       mr.id_target_system,
       mr.id_parent_event_type,
       mu.outer_id,
       mu.user_settings,
       b.bot_name,
       b.bot_settings,
       m.messenger_code
FROM (SELECT mr_1.id_bot,
             mr_1.id_messenger,
             mr_1.id_event_type,
             mr_1.id_target_system,
             (SELECT et.id_parent
              FROM cls_event_type et
              WHERE et.uuid = mr_1.id_event_type) AS id_parent_event_type,
             mr_1.id_user
      FROM reg_message_route mr_1
      WHERE mr_1.is_deleted = false
        AND NOT mr_1.date_activation IS NULL) mr
         JOIN (SELECT mu_1.id_user,
                      mu_1.id_messenger,
                      mu_1.outer_id,
                      mu_1.settings AS user_settings
               FROM reg_messenger_user mu_1
               WHERE mu_1.is_deleted = false) mu USING (id_user, id_messenger)
         JOIN (SELECT b_1.uuid     AS id_bot,
                      b_1.name     AS bot_name,
                      b_1.settings AS bot_settings
               FROM cls_bot b_1
               WHERE b_1.is_deleted = false) b USING (id_bot)
         JOIN (SELECT m_1.uuid AS id_messenger,
                      m_1.code AS messenger_code
               FROM cls_messenger m_1
               WHERE m_1.is_deleted = false) m USING (id_messenger);

alter table v_messenger_user_message_route owner to postgres;

