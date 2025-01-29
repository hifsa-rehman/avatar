import React from 'react';

class ARErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AR Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="ar-error-message">
          <h3>AR Failed to Initialize</h3>
          <p>Please ensure your browser supports WebAR and try:</p>
          <ul>
            <li>Using HTTPS</li>
            <li>Allowing camera access</li>
            <li>Using a modern browser (Chrome recommended)</li>
          </ul>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ARErrorBoundary;
