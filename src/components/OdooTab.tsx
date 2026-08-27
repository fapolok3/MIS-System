import React, { useState } from 'react';

const ODOO_URL = 'https://inovace-technologies-ltd1.odoo.com/odoo';

export const OdooTab: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative w-full h-full bg-white dark:bg-slate-900 overflow-hidden flex flex-col" id="odoo-module-container">
      {isLoading && (
        <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900 z-10 flex flex-col items-center justify-center space-y-3">
          <div className="w-9 h-9 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 tracking-wide">
            Loading Odoo...
          </p>
        </div>
      )}

      <iframe
        src={ODOO_URL}
        title="Odoo"
        className="w-full h-full border-0 flex-1"
        onLoad={() => setIsLoading(false)}
        allow="camera; microphone; geolocation; clipboard-read; clipboard-write; fullscreen"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads"
      />
    </div>
  );
};

