const Loader = ({ label = 'Loading...' }) => (
  <div className="loader">
    <span className="loader__spinner" aria-hidden="true" />
    <p>{label}</p>
  </div>
);

export default Loader;

