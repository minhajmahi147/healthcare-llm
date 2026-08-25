/**
 * Simple CSS loading spinner.
 * Pages show this in a centered layout while useAsync is fetching profile, plan,
 * diet, or prescription data.
 */
export function Spinner() {
  return <div className="spinner" aria-label="Loading" />;
}
