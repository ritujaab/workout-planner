const EmptyState = ({ title, description, action }) => (
  <div className="empty-state">
    <h4>{title}</h4>
    {description && <p>{description}</p>}
    {action && <div className="empty-state__action">{action}</div>}
  </div>
);

export default EmptyState;

