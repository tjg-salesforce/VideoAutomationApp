import React from 'react';

interface SimplePhoneProps {
  customerName?: string;
  agentName?: string;
  messages?: Array<{
    id: string;
    sender: 'customer' | 'agent';
    text: string;
    timestamp?: string;
  }>;
  scale?: number; // Scale factor for the entire component
}

const SimplePhone: React.FC<SimplePhoneProps> = ({
  customerName = 'Customer',
  agentName = 'Agent',
  messages = [],
  scale = 0.8 // Larger default scale to match image
}) => {
  const displayMessages = messages;

  return (
    <>
      <style>{`
        .from-me {
          align-self: flex-end;
          background-color: #248bf5;
          color: #fff;
        }
        
        .from-me::before {
          border-bottom-left-radius: 0.8rem 0.7rem;
          border-right: 1rem solid #248bf5;
          right: -0.35rem;
          transform: translate(0, -0.1rem);
        }
        
        .from-me::after {
          background-color: #fff;
          border-bottom-left-radius: 0.5rem;
          right: -40px;
          transform: translate(-30px, -2px);
          width: 10px;
        }
        
        .from-them {
          align-self: flex-start;
          background-color: #e5e5ea;
          color: #000;
        }
        
        .from-them::before {
          border-bottom-right-radius: 0.8rem 0.7rem;
          border-left: 1rem solid #e5e5ea;
          left: -0.35rem;
          transform: translate(0, -0.1rem);
        }
        
        .from-them::after {
          background-color: #fff;
          border-bottom-right-radius: 0.5rem;
          left: 20px;
          transform: translate(-30px, -2px);
          width: 10px;
        }
        
        .from-me::before,
        .from-me::after,
        .from-them::before,
        .from-them::after {
          bottom: -0.1rem;
          content: "";
          height: 1rem;
          position: absolute;
        }
      `}</style>
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
        // Removed background color so it doesn't hide underlying layers
      }}>
      <div style={{
        width: `${375 * scale}px`, // Original iPhone width scaled
        height: `${812 * scale}px`, // Original iPhone height scaled
        backgroundColor: '#1a1a1a',
        borderRadius: `${40 * scale}px`, // Original border radius scaled
        boxShadow: `0 ${25 * scale}px ${50 * scale}px -12px rgba(0, 0, 0, 0.25), inset 0 0 ${10 * scale}px rgba(255, 255, 255, 0.1)`,
        position: 'relative',
        overflow: 'hidden',
        border: `${8 * scale}px solid #333`, // Original border scaled
        display: 'flex',
        flexDirection: 'column'
      }}>
      {/* The notch */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: `${160 * scale}px`, // Original notch width scaled
        height: `${30 * scale}px`, // Original notch height scaled
        backgroundColor: '#1a1a1a',
        borderBottomLeftRadius: `${15 * scale}px`, // Original scaled
        borderBottomRightRadius: `${15 * scale}px`, // Original scaled
        zIndex: 10
      }}></div>

      {/* The screen content */}
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Status Bar */}
        <div style={{
          backgroundColor: '#efefef',
          padding: `${10 * scale}px ${20 * scale}px`, // Original padding scaled
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#000',
          fontSize: `${14 * scale}px`, // Original font size scaled
          fontWeight: 600,
          position: 'relative',
          zIndex: 5
        }}>
          <span>9:41</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: `${6 * scale}px` }}>
            {/* Cellular Signal SVG - original size scaled */}
            <svg width={`${17 * scale}px`} height={`${11 * scale}px`} viewBox="0 0 17 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.5" y="6.5" width="2" height="4.5" rx="1" fill="#000"/>
              <rect x="4.5" y="4" width="2" height="7" rx="1" fill="#000"/>
              <rect x="8.5" y="1.5" width="2" height="9.5" rx="1" fill="#000"/>
              <rect x="12.5" y="0.5" width="2" height="10.5" rx="1" fill="#000"/>
            </svg>
            {/* 5G text */}
            <span style={{ fontSize: `${14 * scale}px`, fontWeight: 600 }}>5G</span>
            {/* Battery SVG - original size scaled */}
            <svg width={`${25 * scale}px`} height={`${11 * scale}px`} viewBox="0 0 25 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1.5" y="0.5" width="19" height="10" rx="2.5" stroke="#000" strokeWidth="1.5"/>
              <path d="M21.5 3.5V7.5C21.5 8.5 22 9 23.5 9V2C22 2 21.5 2.5 21.5 3.5Z" fill="#000" stroke="#000" strokeWidth="1.5"/>
              <rect x="2.5" y="2.5" width="16" height="6" rx="1" fill="#000"/>
            </svg>
          </div>
        </div>

        {/* Conversation Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${6 * scale}px`,
          backgroundColor: '#efefef',
          borderBottom: '1px solid #e0e0e0',
          position: 'relative'
        }}>
          <span style={{
            position: 'absolute',
            left: '10px',
            color: '#007aff',
            fontSize: `${16 * scale}px`,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: `${4 * scale}px`
          }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <svg viewBox="0 0 10 20" xmlns="http://www.w3.org/2000/svg" style={{ fill: 'none', stroke: '#007aff', strokeWidth: `${2.5 * scale}`, strokeLinecap: 'round', strokeLinejoin: 'round', width: `${8 * scale}px`, height: `${18 * scale}px` }}>
                <polyline points="9 1 1 10 9 19"></polyline>
              </svg>
            </span>
            <span style={{
              backgroundColor: '#007aff',
              color: 'white',
              borderRadius: '9999px',
              fontSize: `${12 * scale}px`,
              fontWeight: 600,
              padding: `${2 * scale}px ${7 * scale}px`,
              minWidth: `${20 * scale}px`,
              textAlign: 'center'
            }}>9</span>
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: `${50 * scale}px`, // Original profile pic size scaled
              height: `${50 * scale}px`, // Original profile pic size scaled
              borderRadius: '50%',
              overflow: 'hidden',
              border: `${2 * scale}px solid white`, // Original border scaled
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <img 
                src={`https://placehold.co/100x100/146A34/white?text=${agentName.charAt(0)}`} 
                alt={`${agentName} Profile`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: `${4 * scale}px`, marginTop: `${4 * scale}px` }}>
              <span style={{ fontSize: `${12.8 * scale}px`, fontWeight: 400, color: '#000' }}>{agentName}</span>
              <span>
                <svg viewBox="0 0 10 20" xmlns="http://www.w3.org/2000/svg" style={{ fill: 'none', stroke: '#8e8e93', strokeWidth: `${2 * scale}`, strokeLinecap: 'round', strokeLinejoin: 'round', width: `${6.4 * scale}px`, height: `${14.4 * scale}px` }}>
                  <polyline points="1 1 9 10 1 19"></polyline>
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* Messages Section */}
        <div style={{
          backgroundColor: '#f7f7f7',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          padding: '10px',
          overflowY: 'auto',
          gap: '8px',
          width: '100%' // Full width like header/footer
        }}>
          {displayMessages.length > 0 ? (
            displayMessages.map((message) => (
              <p
                key={message.id}
                className={message.sender === 'customer' ? 'from-me' : 'from-them'}
                style={{
                  borderRadius: `${1.15 * scale}rem`, // Original border radius scaled
                  lineHeight: 1.25,
                  maxWidth: '75%',
                  padding: `${0.5 * scale}rem ${0.875 * scale}rem`, // Original padding scaled
                  position: 'relative',
                  wordWrap: 'break-word',
                  fontSize: `${15 * scale}px`, // Original font size scaled
                  margin: `${0.5 * scale}rem 0`, // Original margin scaled
                  width: 'fit-content'
                }}
              >
                {message.text}
              </p>
            ))
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#8e8e93',
              fontSize: `${14 * scale}px`,
              textAlign: 'center',
              padding: '20px'
            }}>
              <div>
                <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>No messages yet</p>
                <p style={{ margin: '0', fontSize: `${12 * scale}px` }}>Add messages in the properties panel</p>
              </div>
            </div>
          )}
        </div>

        {/* Message Input Bar */}
        <div style={{
          backgroundColor: '#fff',
          padding: `${8 * scale}px ${10 * scale}px 0`, // Scaled padding
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: 0,
            backgroundColor: '#fff',
            gap: `${8 * scale}px` // Scaled gap
          }}>
            <span style={{
              cursor: 'pointer',
              width: `${24 * scale}px`, // Scaled width
              height: `${24 * scale}px`, // Scaled height
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#e5e5ea',
              borderRadius: '50%',
              padding: `${4 * scale}px` // Scaled padding
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width={`${24 * scale}px`} height={`${24 * scale}px`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={`${2 * scale}`} strokeLinecap="round" strokeLinejoin="round" style={{ stroke: '#929292', strokeWidth: `${2.5 * scale}px`, width: `${18 * scale}px`, height: `${18 * scale}px` }}>
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </span>
            <input 
              type="text" 
              style={{
                flexGrow: 1,
                backgroundColor: '#f7f7f7',
                border: 'none',
                borderRadius: `${20 * scale}px`, // Scaled border radius
                padding: `${8 * scale}px ${12 * scale}px`, // Scaled padding
                fontSize: `${15 * scale}px`, // Scaled font size
                outline: 'none',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
              }}
              placeholder="Text Message • SMS"
              disabled
            />
            <span style={{
              cursor: 'pointer',
              width: `${24 * scale}px`, // Scaled width
              height: `${24 * scale}px`, // Scaled height
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8e8e93',
              marginRight: `${5 * scale}px` // Scaled margin
            }}>
              <svg viewBox="0 0 13 18" xmlns="http://www.w3.org/2000/svg" fill="#8e8e93" style={{ width: `${13 * scale}px`, height: `${18 * scale}px` }}>
                <path d="M6.5 12C8.433 12 10 10.328 10 8.25V3.75C10 1.672 8.433 0 6.5 0S3 1.672 3 3.75V8.25C3 10.328 4.567 12 6.5 12ZM11.125 8.25V9.375C11.125 11.517 9.539 13.25 7.5 13.25V15.5H5.5V13.25C3.461 13.25 1.875 11.517 1.875 9.375V8.25H0.125V9.375C0.125 12.03 2.164 14.25 4.875 14.625V17H8.125V14.625C10.836 14.25 12.875 12.03 12.875 9.375V8.25H11.125Z"/>
              </svg>
            </span>
          </div>
          <div style={{
            width: `${140 * scale}px`, // Scaled width
            height: `${5 * scale}px`, // Scaled height
            backgroundColor: '#000',
            borderRadius: `${2.5 * scale}px`, // Scaled border radius
            margin: `${8 * scale}px auto ${8 * scale}px` // Scaled margin
          }}></div>
        </div>
      </div>
      </div>
    </div>
    </>
  );
};

export default SimplePhone;
