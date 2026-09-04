export default function UnauthorizedPage() {
  return (
    <main style={{ maxWidth: 560, margin: "15vh auto", padding: 32 }}>
      <h1>暂时无法访问生日簿</h1>
      <p>你的统一账号尚未获得生日项目权限，请联系管理员分配 app-bday 角色。</p>
      <p><a href="/api/auth/logout">退出并切换账号</a></p>
    </main>
  );
}

