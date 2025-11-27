import { useEffect } from 'react';

const DeleteConfirmDialog = ({ isOpen, onClose, onConfirm, workoutTitle, date }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formattedDate = date ? date.toISOString().slice(0, 10) : '';

  const handleThisInstance = () => {
    onConfirm('this');
    onClose();
  };

  const handleAllOccurrences = () => {
    onConfirm('all');
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        overflow: 'hidden',
      }}
      onClick={handleCancel}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '400px',
          width: '90%',
          maxHeight: '90vh',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: '0 0 1rem 0',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#1e293b',
          }}
        >
          Delete Workout
        </h3>
        <p
          style={{
            margin: '0 0 1.5rem 0',
            color: '#64748b',
            fontSize: '0.95rem',
            lineHeight: '1.5',
          }}
        >
          What would you like to do with <strong>{workoutTitle}</strong>
          {formattedDate && ` on ${formattedDate}`}?
        </p>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <button
            type="button"
            onClick={handleThisInstance}
            style={{
              padding: '0.75rem 1rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            This Instance
          </button>
          <button
            type="button"
            onClick={handleAllOccurrences}
            style={{
              padding: '0.75rem 1rem',
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#e2e8f0';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            All Occurrences (Future)
          </button>
          <button
            type="button"
            onClick={handleCancel}
            style={{
              padding: '0.75rem 1rem',
              background: 'transparent',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmDialog;

