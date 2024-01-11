BEGIN TRANSACTION;
WITH to_delete AS (select t2.topic, t1.seq_id
                   from max_seq_id t1
                            left join segments t2 on t1.segment_id = t2.id
                   where t2.scope = 'METADATA')
DELETE
FROM embeddings_queue
WHERE EXISTS (SELECT 1
              FROM to_delete td
              WHERE td.topic = embeddings_queue.topic
                AND td.seq_id >= embeddings_queue.seq_id);


COMMIT;
VACUUM;