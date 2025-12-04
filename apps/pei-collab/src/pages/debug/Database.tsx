import React from 'react';
import { DatabaseTestRunner } from '@/components/debug/DatabaseTestRunner';

export default function DatabaseDebug() {
  return (
    <div className="container mx-auto p-6">
      <DatabaseTestRunner />
    </div>
  );
}
