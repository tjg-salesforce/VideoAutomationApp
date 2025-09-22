import React from 'react';

export interface iPhoneSMSSimpleProps {
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

const iPhoneSMS: React.FC<iPhoneSMSSimpleProps> = ({
  customerName = 'Customer',
  agentName = 'Agent',
  messages = [],
  className = '',
  style = {}
}) => {
  console.log('iPhoneSMSSimple rendering with props:', {
    customerName,
    agentName,
    messages,
    className,
    style
  });
  
  try {
    return (
      <div 
        className={`iphone-sms-container ${className}`}
        style={{
          ...style,
          width: '100%',
          height: '100%',
          backgroundColor: 'purple',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 'bold'
        }}
      >
        <div>
          <p>iPhone SMS Component</p>
          <p>Customer: {customerName}</p>
          <p>Agent: {agentName}</p>
          <p>Messages: {messages.length}</p>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in iPhoneSMSSimple:', error);
    return (
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'red',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px'
      }}>
        Error in iPhoneSMSSimple: {error.message}
      </div>
    );
  }
};

export default iPhoneSMS;
