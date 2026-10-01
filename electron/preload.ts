// Preload (spec §13.1): exposes exactly `window.unin` through contextBridge. Runs sandboxed, so it
// imports nothing but electron; channel literals are checked against IpcChannel.
import { contextBridge, ipcRenderer } from 'electron';
import type { IpcChannel, UninBridge } from '../src/platform/desktop/bridge';

const invoke = <T>(channel: IpcChannel, ...args: unknown[]) =>
  ipcRenderer.invoke(channel, ...args) as Promise<T>;
const channel = (c: IpcChannel) => c;

const unin: UninBridge = {
  save: {
    load: () => invoke('unin:save:load'),
    write: (json) => invoke('unin:save:write', json),
    markCorrupt: (source) => invoke('unin:save:markCorrupt', source),
    listBackups: () => invoke('unin:save:listBackups'),
    restoreBackup: (name) => invoke('unin:save:restoreBackup', name),
    exportTo: (json, suggestedName) => invoke('unin:save:exportTo', json, suggestedName),
    importFrom: () => invoke('unin:save:importFrom'),
    openFolder: () => invoke('unin:save:openFolder'),
  },
  app: {
    version: ipcRenderer.sendSync(channel('unin:app:version')) as string,
    onFlushRequest(flush) {
      ipcRenderer.on(channel('unin:app:flushRequest'), () => {
        void flush()
          .catch(() => undefined)
          .finally(() => ipcRenderer.send(channel('unin:app:flushDone')));
      });
    },
  },
};

contextBridge.exposeInMainWorld('unin', unin);
