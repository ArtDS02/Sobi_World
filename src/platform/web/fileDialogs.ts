// Browser fallback for export/import (spec §9.3): download link and file input.
import type { FileDialogs } from '../../core/save/port';

export function createWebFileDialogs(): FileDialogs {
  return {
    async exportSave(json, suggestedName) {
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = suggestedName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      return true; // the browser gives no signal when the player cancels the download
    },
    importSave() {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json,.json';
        input.addEventListener('change', () => {
          const file = input.files?.[0];
          if (file) void file.text().then(resolve, () => resolve(null));
          else resolve(null);
        });
        input.addEventListener('cancel', () => resolve(null));
        input.click();
      });
    },
    openSaveFolder: () => null,
  };
}
