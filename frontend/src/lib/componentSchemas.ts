// Component Schema System
// This defines the structure and validation for all component types

export interface ComponentProperty {
  id: string;
  name: string;
  type: 'text' | 'number' | 'color' | 'file' | 'select' | 'textarea' | 'boolean' | 'array';
  label: string;
  description?: string;
  required?: boolean;
  defaultValue?: any;
  options?: Array<{ value: any; label: string }>; // For select types
  min?: number; // For number types
  max?: number; // For number types
  step?: number; // For number types
  accept?: string; // For file types
  placeholder?: string;
  rows?: number; // For textarea types
  arrayItemSchema?: ComponentProperty; // For array types
}

export interface ComponentSchema {
  type: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  duration: number;
  properties: ComponentProperty[];
  defaultProperties: Record<string, any>;
  renderer: {
    type: 'css' | 'html' | 'canvas' | 'hybrid';
    component: string; // Path to the component
  };
}

// Component Schemas Registry
export const componentSchemas: Record<string, ComponentSchema> = {
  'customer_logo_split': {
    type: 'customer_logo_split',
    name: 'Customer Logo Split',
    description: 'Animated logo split with customer branding',
    category: 'Motion Graphics',
    duration: 5,
    properties: [
      {
        id: 'customerLogo',
        name: 'customerLogo',
        type: 'file',
        label: 'Custom Logo Upload',
        description: 'Upload your customer logo',
        accept: 'image/*',
        required: true
      },
      {
        id: 'backgroundColor',
        name: 'backgroundColor',
        type: 'color',
        label: 'Background Color',
        description: 'Background color for the animation',
        defaultValue: '#184cb4'
      },
      {
        id: 'logoScale',
        name: 'logoScale',
        type: 'number',
        label: 'Logo Scale',
        description: 'Scale factor for the logo',
        min: 0.1,
        max: 2,
        step: 0.1,
        defaultValue: 1
      }
    ],
    defaultProperties: {
      backgroundColor: '#184cb4',
      logoScale: 1,
      customerLogo: null
    },
    renderer: {
      type: 'css',
      component: 'LogoSplitCSS'
    }
  },
  
  'iphone_sms': {
    type: 'iphone_sms',
    name: 'iPhone SMS Conversation',
    description: 'Interactive SMS conversation in iPhone interface',
    category: 'UI Components',
    duration: 10,
    properties: [
      {
        id: 'customerName',
        name: 'customerName',
        type: 'text',
        label: 'Customer Name',
        description: 'Name displayed for customer messages',
        placeholder: 'Customer',
        defaultValue: 'Customer'
      },
      {
        id: 'agentName',
        name: 'agentName',
        type: 'text',
        label: 'Agent Name',
        description: 'Name displayed for agent messages',
        placeholder: 'Agent',
        defaultValue: 'Agent'
      },
      {
        id: 'scale',
        name: 'scale',
        type: 'range',
        label: 'Scale',
        description: 'Scale factor for the entire iPhone component',
        min: 0.1,
        max: 1.0,
        step: 0.1,
        defaultValue: 0.8
      },
      {
        id: 'messages',
        name: 'messages',
        type: 'array',
        label: 'Messages',
        description: 'SMS conversation messages',
        arrayItemSchema: {
          id: 'message',
          name: 'message',
          type: 'object',
          label: 'Message',
          properties: [
            {
              id: 'sender',
              name: 'sender',
              type: 'select',
              label: 'Sender',
              options: [
                { value: 'customer', label: 'Customer' },
                { value: 'agent', label: 'Agent' }
              ],
              defaultValue: 'customer'
            },
            {
              id: 'text',
              name: 'text',
              type: 'textarea',
              label: 'Message Text',
              placeholder: 'Enter message text...',
              rows: 2,
              defaultValue: 'New message...'
            },
            {
              id: 'timestamp',
              name: 'timestamp',
              type: 'text',
              label: 'Timestamp',
              description: 'Optional timestamp for the message',
              placeholder: '2024-01-01T12:00:00'
            }
          ]
        },
        defaultValue: []
      }
    ],
    defaultProperties: {
      customerName: 'Customer',
      agentName: 'Agent',
      messages: []
    },
    renderer: {
      type: 'css',
      component: 'iPhoneSMSCSS'
    }
  }
};

// Helper functions
export const getComponentSchema = (type: string): ComponentSchema | null => {
  return componentSchemas[type] || null;
};

export const getDefaultProperties = (type: string): Record<string, any> => {
  const schema = getComponentSchema(type);
  return schema?.defaultProperties || {};
};

export const validateComponentProperties = (type: string, properties: Record<string, any>): boolean => {
  const schema = getComponentSchema(type);
  if (!schema) return false;
  
  // Check required properties
  for (const prop of schema.properties) {
    if (prop.required && (properties[prop.id] === undefined || properties[prop.id] === null)) {
      return false;
    }
  }
  
  return true;
};
