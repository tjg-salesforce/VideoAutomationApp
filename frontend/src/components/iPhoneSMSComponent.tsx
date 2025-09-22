import React, { useState } from 'react';

export interface SMSMessage {
  id: string;
  sender: 'customer' | 'agent';
  text: string;
  timestamp?: string;
}

export interface iPhoneSMSProps {
  customerName: string;
  agentName: string;
  messages: SMSMessage[];
  onUpdate?: (props: Partial<iPhoneSMSProps>) => void;
}

const iPhoneSMSComponent: React.FC<iPhoneSMSProps> = ({
  customerName = 'Customer',
  agentName = 'Agent',
  messages = [],
  onUpdate
}) => {
  const [localMessages, setLocalMessages] = useState<SMSMessage[]>(messages);

  const addMessage = () => {
    const newMessage: SMSMessage = {
      id: `msg_${Date.now()}`,
      sender: 'customer',
      text: 'New message...'
    };
    const updatedMessages = [...localMessages, newMessage];
    setLocalMessages(updatedMessages);
    onUpdate?.({ messages: updatedMessages });
  };

  const updateMessage = (messageId: string, updates: Partial<SMSMessage>) => {
    const updatedMessages = localMessages.map(msg =>
      msg.id === messageId ? { ...msg, ...updates } : msg
    );
    setLocalMessages(updatedMessages);
    onUpdate?.({ messages: updatedMessages });
  };

  const deleteMessage = (messageId: string) => {
    const updatedMessages = localMessages.filter(msg => msg.id !== messageId);
    setLocalMessages(updatedMessages);
    onUpdate?.({ messages: updatedMessages });
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="iphone-sms-container">
      {/* iPhone Frame */}
      <div className="iphone-frame">
        {/* Status Bar */}
        <div className="status-bar">
          <div className="time">9:41</div>
          <div className="status-icons">
            <span className="signal">📶</span>
            <span className="wifi">📶</span>
            <span className="battery">🔋</span>
          </div>
        </div>

        {/* Header */}
        <div className="sms-header">
          <div className="contact-info">
            <div className="contact-name">{agentName}</div>
            <div className="contact-status">Active now</div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="messages-container">
          {localMessages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.sender === 'customer' ? 'customer' : 'agent'}`}
            >
              <div className="message-bubble">
                <div className="message-text">{message.text}</div>
                <div className="message-time">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="input-area">
          <div className="input-field">
            <input
              type="text"
              placeholder="Message"
              className="message-input"
              disabled
            />
            <button className="send-button" disabled>Send</button>
          </div>
        </div>
      </div>

      {/* Properties Panel Content */}
      <div className="properties-panel-content" style={{ display: 'none' }}>
        <div className="property-group">
          <label>Customer Name:</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => onUpdate?.({ customerName: e.target.value })}
            className="property-input"
          />
        </div>

        <div className="property-group">
          <label>Agent Name:</label>
          <input
            type="text"
            value={agentName}
            onChange={(e) => onUpdate?.({ agentName: e.target.value })}
            className="property-input"
          />
        </div>

        <div className="property-group">
          <label>Messages:</label>
          <button onClick={addMessage} className="add-message-btn">
            + Add Message
          </button>
          
          {localMessages.map((message, index) => (
            <div key={message.id} className="message-config">
              <div className="message-header">
                <span>Message {index + 1}</span>
                <button
                  onClick={() => deleteMessage(message.id)}
                  className="delete-message-btn"
                >
                  ×
                </button>
              </div>
              
              <div className="message-settings">
                <div className="setting-row">
                  <label>Sender:</label>
                  <select
                    value={message.sender}
                    onChange={(e) => updateMessage(message.id, { 
                      sender: e.target.value as 'customer' | 'agent' 
                    })}
                    className="property-select"
                  >
                    <option value="customer">{customerName}</option>
                    <option value="agent">{agentName}</option>
                  </select>
                </div>
                
                <div className="setting-row">
                  <label>Text:</label>
                  <textarea
                    value={message.text}
                    onChange={(e) => updateMessage(message.id, { text: e.target.value })}
                    className="property-textarea"
                    rows={3}
                  />
                </div>
                
                <div className="setting-row">
                  <label>Timestamp:</label>
                  <input
                    type="datetime-local"
                    value={message.timestamp || ''}
                    onChange={(e) => updateMessage(message.id, { 
                      timestamp: e.target.value 
                    })}
                    className="property-input"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default iPhoneSMSComponent;
