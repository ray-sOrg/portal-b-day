-- 在 Supabase SQL Editor 中以数据库所有者执行；密码请由 Secret 管理器生成并注入，勿写入仓库。
CREATE ROLE bday_runtime NOLOGIN;
GRANT USAGE ON SCHEMA bday TO bday_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA bday TO bday_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA bday TO bday_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA bday
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO bday_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA bday
  GRANT USAGE, SELECT ON SEQUENCES TO bday_runtime;

-- 单独创建 LOGIN 角色后，将运行权限授予它：
-- CREATE ROLE bday_app LOGIN PASSWORD '<由 Secret 管理器生成>';
-- GRANT bday_runtime TO bday_app;
