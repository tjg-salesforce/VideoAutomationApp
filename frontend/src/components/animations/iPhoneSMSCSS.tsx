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
  currentTime?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Calculate word count for a message text
 */
function getWordCount(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  // Split by whitespace and filter out empty strings
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Calculate delay for a single message based on word count
 * Formula: Delay (seconds) = (Word Count × 0.204) + 1.275
 * This is 15% faster than the original: (Word Count × 0.24) + 1.5
 * Round to nearest whole second
 * If word count is 0, delay is 1 second
 */
function calculateMessageDelay(text: string): number {
  const wordCount = getWordCount(text);
  
  if (wordCount === 0) {
    return 1; // 1 second for empty/emoji-only messages
  }
  
  // Calculate delay: (Word Count × 0.204) + 1.275 (15% faster than original)
  // Original: (Word Count × 0.24) + 1.5
  // 15% faster: multiply by 0.85 → (Word Count × 0.204) + 1.275
  const delay = (wordCount * 0.204) + 1.275;
  
  // Round to nearest whole second
  return Math.round(delay);
}

/**
 * Calculate cumulative timing for all messages
 * Each message delay is calculated individually based on word count
 * Returns an array of { message, startTime, endTime, delay } for each message
 */
export function calculateMessageTimings(messages: Array<{ id: string; sender: 'customer' | 'agent'; text: string }>) {
  const timings: Array<{ message: typeof messages[0]; startTime: number; endTime: number; delay: number }> = [];
  
  console.log('⏱️ calculateMessageTimings: Processing', messages.length, 'messages with NEW word-count-based timing');
  
  let cumulativeTime = 0;
  
  for (let i = 0; i < messages.length; i++) {
    const delay = calculateMessageDelay(messages[i].text);
    const startTime = cumulativeTime;
    const endTime = startTime + delay;
    const wordCount = getWordCount(messages[i].text);
    
    console.log(`⏱️ Message ${i + 1}: startTime=${startTime.toFixed(2)}s, delay=${delay}s, wordCount=${wordCount}, formula: (${wordCount} × 0.204) + 1.275 = ${(wordCount * 0.204 + 1.275).toFixed(2)}s, text="${messages[i].text.substring(0, 30)}..."`);
    
    timings.push({
      message: messages[i],
      startTime,
      endTime,
      delay
    });
    
    // Next message starts after this message's delay
    cumulativeTime = endTime;
  }
  
  const totalDuration = timings.length > 0 ? timings[timings.length - 1].endTime : 0;
  console.log('⏱️ calculateMessageTimings: Final timings - Total duration:', totalDuration, 'seconds', timings.map(t => ({ startTime: t.startTime.toFixed(2), delay: t.delay, endTime: t.endTime.toFixed(2) })));
  
  return timings;
}

/**
 * Calculate total duration for all messages
 * This is the sum of all individual message delays
 */
export function calculateTotalMessageDuration(messages: Array<{ id: string; sender: 'customer' | 'agent'; text: string }>): number {
  if (messages.length === 0) return 0;
  
  // Sum all individual message delays
  let totalDuration = 0;
  for (const message of messages) {
    totalDuration += calculateMessageDelay(message.text);
  }
  
  return totalDuration;
}

const SMSConversation: React.FC<iPhoneSMSCSSProps> = ({
  customerName = 'Customer',
  agentName = 'Agent',
  messages = [],
  currentTime = 0,
  className = '',
  style = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Calculate message timings
  const messageTimings = React.useMemo(() => {
    return calculateMessageTimings(messages);
  }, [messages]);

  // Calculate which messages should be visible at currentTime
  const visibleMessages = React.useMemo(() => {
    if (messageTimings.length === 0) return [];
    
    // Show messages that have started (currentTime >= startTime)
    // Messages appear at: 0s, 2s, 4s, 6s, etc.
    const visible = messageTimings.filter(timing => currentTime >= timing.startTime);
    
    // Debug logging (only log when currentTime changes significantly)
    if (Math.floor(currentTime) !== Math.floor((window as any).lastLoggedTime || -1)) {
      (window as any).lastLoggedTime = currentTime;
      console.log('iPhoneSMSCSS visibleMessages:', {
        currentTime: currentTime.toFixed(2),
        messageCount: messages.length,
        timings: messageTimings.map(t => ({ startTime: t.startTime, text: t.message.text.substring(0, 20) })),
        visibleCount: visible.length,
        visibleTexts: visible.map(v => v.message.text.substring(0, 20))
      });
    }
    
    // Always show at least the first message if we have messages and currentTime >= 0
    if (messages.length > 0 && currentTime >= 0 && visible.length === 0) {
      return [messageTimings[0]];
    }
    
    return visible;
  }, [messageTimings, currentTime, messages.length]);

  // Calculate if we should show typing bubble (for agent messages only)
  const showTypingBubble = React.useMemo(() => {
    if (messageTimings.length === 0) return false;
    
    // Find the next message that hasn't appeared yet
    const nextMessage = messageTimings.find(timing => currentTime < timing.startTime);
    
    if (!nextMessage) return false;
    
    // Only show typing bubble for agent messages
    if (nextMessage.message.sender !== 'agent') return false;
    
    // Show typing bubble 1.5 seconds before the message appears
    // Clamp to 0 minimum to handle first message
    const typingBubbleStartTime = Math.max(0, nextMessage.startTime - 1.5);
    
    const shouldShow = currentTime >= typingBubbleStartTime && currentTime < nextMessage.startTime;
    
    // Debug logging
    if (shouldShow && Math.floor(currentTime) !== Math.floor((window as any).lastTypingLogTime || -1)) {
      (window as any).lastTypingLogTime = currentTime;
      console.log('💬 Typing bubble should show:', {
        currentTime: currentTime.toFixed(2),
        nextMessageStart: nextMessage.startTime.toFixed(2),
        typingBubbleStart: typingBubbleStartTime.toFixed(2),
        nextMessageSender: nextMessage.message.sender,
        nextMessageText: nextMessage.message.text.substring(0, 30)
      });
    }
    
    return shouldShow;
  }, [messageTimings, currentTime]);

  // Calculate total duration for all messages
  const totalDuration = React.useMemo(() => {
    if (messageTimings.length === 0) return 0;
    return messageTimings[messageTimings.length - 1].endTime;
  }, [messageTimings]);

  useEffect(() => {
    // Scroll to bottom when new messages appear or typing bubble shows
    if (messagesContainerRef.current && (visibleMessages.length > 0 || showTypingBubble)) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [visibleMessages.length, showTypingBubble]);

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
          <div className="imessage" ref={messagesContainerRef}>
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
            ) : visibleMessages.length === 0 ? (
              <>
                {/* Show typing bubble even when no messages are visible yet */}
                {showTypingBubble ? (
                  <div className="typing-bubble from-them">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                ) : (
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
                      <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>Waiting for messages...</p>
                      <p style={{ margin: '0', fontSize: '12px' }}>Current time: {currentTime.toFixed(2)}s</p>
                      <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Total messages: {messages.length}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {visibleMessages.map((timing, index) => {
                  const isNewlyAppearing = index === visibleMessages.length - 1 && 
                    currentTime >= timing.startTime && 
                    currentTime < timing.startTime + 0.3; // Animation duration
                  
                  return (
                    <p
                      key={timing.message.id}
                      className={`${timing.message.sender === 'customer' ? 'from-me' : 'from-them'} ${isNewlyAppearing ? 'message-appearing' : ''}`}
                      style={{
                        animation: isNewlyAppearing ? 'messageSlideIn 0.3s ease-out' : undefined
                      }}
                    >
                      {timing.message.text}
                    </p>
                  );
                })}
                {/* Typing bubble for agent messages */}
                {showTypingBubble && (
                  <div className="typing-bubble from-them">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
              </>
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

// Export with proper name for React (default export for backward compatibility)
const iPhoneSMSCSS = SMSConversation;
export default iPhoneSMSCSS;
export { SMSConversation as iPhoneSMSCSSComponent };
