function codeClass(status) {
  if (status === 0) return "c0";
  if (status >= 200 && status < 300) return "c2xx";
  return "c4xx";
}

function label(entry) {
  if (entry.status === 0) return "NET";
  return entry.status;
}

/**
 * The whole point of today's assignment is that a 200 is not a 404 is
 * not a 204 -- so instead of hiding that behind toasts, every real
 * response lands here exactly as the server sent it.
 */
export default function Ledger({ entries }) {
  return (
    <div className="ledger">
      <div className="ledger-head">
        <span>
          <span className="ledger-dot" />
          status ledger
        </span>
        <span>{entries.length ? `last ${entries.length}` : "idle"}</span>
      </div>
      <div className="ledger-list">
        {entries.length === 0 && (
          <div className="ledger-empty">No requests yet — try creating a note.</div>
        )}
        {entries.map((e, i) => (
          <div className="ledger-row" key={i}>
            <span className={`ledger-code ${codeClass(e.status)}`}>{label(e)}</span>
            <span className="ledger-path">
              {e.method} {e.path}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
