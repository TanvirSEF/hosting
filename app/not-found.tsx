import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Page Not Found | WebblyHosting',
};

export default function RootNotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FAFAFA',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Simple Header */}
      <header
        style={{
          width: '100%',
          padding: '1.5rem',
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: 'white',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#8C52FF',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '18px',
                }}
              >
                W
              </span>
            </div>
            <span
              style={{
                fontWeight: 'bold',
                fontSize: '20px',
                color: '#1E1F21',
              }}
            >
              WebblyHosting
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          {/* 404 Number */}
          <div style={{ marginBottom: '1.5rem' }}>
            <span
              style={{
                fontSize: 'clamp(100px, 20vw, 160px)',
                fontWeight: 'bold',
                lineHeight: 1,
                background:
                  'linear-gradient(135deg, #8C52FF 0%, #A78BFA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              404
            </span>
          </div>

          {/* Message */}
          <h1
            style={{
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              fontWeight: 'bold',
              color: '#1E1F21',
              marginBottom: '0.75rem',
            }}
          >
            Page Not Found
          </h1>
          <p
            style={{
              color: '#667085',
              fontSize: '1rem',
              lineHeight: 1.6,
              marginBottom: '2rem',
            }}
          >
            Sorry, the page you're looking for doesn't exist or has been
            moved.
          </p>

          {/* Buttons */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.875rem 2rem',
                backgroundColor: '#8C52FF',
                color: 'white',
                borderRadius: '9999px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                transition: 'background-color 0.2s',
              }}
            >
              Go to Homepage
            </Link>
            <Link
              href="/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.875rem 2rem',
                backgroundColor: 'transparent',
                color: '#667085',
                border: '1px solid #DBD5D5',
                borderRadius: '9999px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '1rem',
              }}
            >
              Contact Support
            </Link>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer
        style={{
          width: '100%',
          padding: '1.5rem',
          borderTop: '1px solid #f0f0f0',
          backgroundColor: 'white',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#667085', fontSize: '0.875rem' }}>
          © {new Date().getFullYear()} WebblyHosting. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
