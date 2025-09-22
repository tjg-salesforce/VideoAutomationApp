import React from 'react';

interface TestComponentProps {
  message?: string;
}

const TestComponent: React.FC<TestComponentProps> = ({ message = 'Hello World' }) => {
  return (
    <div className="w-full h-full bg-blue-100 rounded-lg flex items-center justify-center">
      <div className="text-center text-blue-800">
        <p className="text-lg font-medium">Test Component</p>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
};

export default TestComponent;
