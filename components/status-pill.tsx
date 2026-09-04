const statusCopy = {
  PENDING: "待发送",
  SENT: "已送达",
  FAILED: "发送失败",
  SKIPPED: "已跳过",
} as const;

export function StatusPill({ status }: { status: keyof typeof statusCopy }) {
  return <span className={`status-pill status-${status.toLowerCase()}`}>{statusCopy[status]}</span>;
}
