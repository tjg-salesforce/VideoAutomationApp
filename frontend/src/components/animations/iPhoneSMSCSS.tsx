import React, { useEffect, useRef } from 'react';
import './iPhoneSMSCSS.css';

export interface iPhoneSMSCSSProps {
  customerName?: string;
  agentName?: string;
  messages?: Array<{
    id: string;
    sender: 'customer' | 'agent';
    text: string;
    timestamp?: string;
  }>;
  className?: string;
  style?: React.CSSProperties;
}

const iPhoneSMSCSS: React.FC<iPhoneSMSCSSProps> = ({
  customerName = 'Customer',
  agentName = 'Agent',
  messages = [],
  className = '',
  style = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add any initialization logic here if needed
    if (containerRef.current) {
      // Ensure the component is properly initialized
    }
  }, [customerName, agentName, messages]);

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      ref={containerRef}
      className={`iphone-sms-container ${className}`}
      style={style}
    >
      <div className="phone-bezel">
        {/* The notch */}
        <div className="notch"></div>
        {/* The screen content */}
        <div className="screen">
          {/* Status Bar */}
          <div className="status-bar">
            <span>9:41</span>
            <div className="right-icons">
              {/* Cellular Signal SVG */}
              <svg width="17" height="11" viewBox="0 0 17 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.5" y="6.5" width="2" height="4.5" rx="1" fill="#000"/>
                <rect x="4.5" y="4" width="2" height="7" rx="1" fill="#000"/>
                <rect x="8.5" y="1.5" width="2" height="9.5" rx="1" fill="#000"/>
                <rect x="12.5" y="0.5" width="2" height="10.5" rx="1" fill="#000"/>
              </svg>
              {/* 5G text */}
              <span className="text-sm font-bold">5G</span>
              {/* Battery SVG */}
              <svg width="25" height="11" viewBox="0 0 25 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1.5" y="0.5" width="19" height="10" rx="2.5" stroke="#000" strokeWidth="1.5"/>
                <path d="M21.5 3.5V7.5C21.5 8.5 22 9 23.5 9V2C22 2 21.5 2.5 21.5 3.5Z" fill="#000" stroke="#000" strokeWidth="1.5"/>
                <rect x="2.5" y="2.5" width="16" height="6" rx="1" fill="#000"/>
              </svg>
            </div>
          </div>

          {/* Conversation Header */}
          <div className="conversation-header">
            <span className="back-button">
              <span className="back-button-chevron">
                <svg viewBox="0 0 10 20" xmlns="http://www.w3.org/2000/svg">
                  <polyline points="9 1 1 10 9 19"></polyline>
                </svg>
              </span>
              <span className="unread-count">9</span>
            </span>
            <div className="header-content">
              <div className="profile-pic-container">
                <img className="profile-pic" src={`https://placehold.co/100x100/9ca3af/white?text=${agentName.charAt(0)}`} alt={`${agentName} Profile`} />
              </div>
              <div className="name-container">
                <span className="contact-name">{agentName}</span>
                <span className="chevron">
                  <svg viewBox="0 0 10 20" xmlns="http://www.w3.org/2000/svg">
                    <polyline points="1 1 9 10 1 19"></polyline>
                  </svg>
                </span>
              </div>
            </div>
          </div>

          {/* Messages Section */}
          <div className="imessage">
            {messages.length === 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#8e8e93',
                fontSize: '14px',
                textAlign: 'center',
                padding: '20px'
              }}>
                <div>
                  <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>No messages yet</p>
                  <p style={{ margin: '0', fontSize: '12px' }}>Add messages in the properties panel</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <p
                  key={message.id}
                  className={message.sender === 'customer' ? 'from-me' : 'from-them'}
                >
                  {message.text}
                </p>
              ))
            )}
          </div>

          {/* Message Input Bar */}
          <div className="message-input-container">
            <div className="message-input">
              <span className="action-icon plus-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </span>
              <input type="text" className="input-box" placeholder="Text Message • SMS" disabled />
              <span className="action-icon microphone-icon">
                <svg viewBox="0 0 13 18" xmlns="http://www.w3.org/2000/svg" fill="#8e8e93">
                  <path d="M6.5 12C8.433 12 10 10.328 10 8.25V3.75C10 1.672 8.433 0 6.5 0S3 1.672 3 3.75V8.25C3 10.328 4.567 12 6.5 12ZM11.125 8.25V9.375C11.125 11.517 9.539 13.25 7.5 13.25V15.5H5.5V13.25C3.461 13.25 1.875 11.517 1.875 9.375V8.25H0.125V9.375C0.125 12.03 2.164 14.25 4.875 14.625V17H8.125V14.625C10.836 14.25 12.875 12.03 12.875 9.375V8.25H11.125Z"/>
                </svg>
              </span>
            </div>
            <div className="home-indicator"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default iPhoneSMSCSS;
