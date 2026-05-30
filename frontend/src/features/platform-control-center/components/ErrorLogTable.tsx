type LogItem = {
  id: string;
  source: string;
  level: string;
  message: string;
  at: string;
};

export function ErrorLogTable({
  items,
  loading,
}: {
  items?: LogItem[];
  loading?: boolean;
}) {
  return (
    <div className="pcc-log-panel app-card">
      <h3 className="pcc-panel-title">Recent errors & warnings</h3>
      {loading ? (
        <div className="pcc-skeleton h-40" />
      ) : !items?.length ? (
        <p className="pcc-empty">No recent errors — system looks healthy.</p>
      ) : (
        <div className="pcc-log-table-wrap">
          <table className="pcc-log-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Level</th>
                <th>Source</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.at).toLocaleString()}</td>
                  <td>
                    <span className={`pcc-log-level pcc-log-level--${row.level}`}>
                      {row.level}
                    </span>
                  </td>
                  <td>{row.source}</td>
                  <td>{row.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
