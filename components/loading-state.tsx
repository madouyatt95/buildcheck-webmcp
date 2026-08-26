export function PageLoading() {
  return (
    <div className="page">
      <div className="skeleton" style={{ width: 190, height: 34, borderRadius: 9, marginBottom: 26 }} />
      <div className="stat-grid">
        {[0, 1, 2, 3].map((item) => <div key={item} className="card skeleton" style={{ height: 116 }} />)}
      </div>
      <div className="card skeleton" style={{ height: 320, marginTop: 24 }} />
    </div>
  );
}
