-- Check active cron jobs
SELECT jobid, schedule, command, nodename, nodeport, database, username, active, jobname
FROM cron.job;

-- Check execution status of recent jobs
SELECT * 
FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
