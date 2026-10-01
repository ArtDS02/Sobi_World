// Second-tab detection over BroadcastChannel (spec §9.4): only one tab may write the save.
import { SAVE } from '../core/config/save';

export interface ChannelLike {
  postMessage(message: unknown): void;
  onmessage: ((event: { data: unknown }) => void) | null;
  close(): void;
}

interface TabMessage {
  kind: 'hello' | 'here';
  id: string;
  primary: boolean;
}

const isTabMessage = (m: unknown): m is TabMessage =>
  typeof m === 'object' && m !== null && 'kind' in m && 'id' in m && 'primary' in m;

export interface TabGuard {
  /** Announces this tab and waits for answers; resolves true when this tab may write. */
  start(): Promise<boolean>;
  isReadOnly(): boolean;
  close(): void;
}

/**
 * Protocol: a new tab posts `hello`; every other tab answers `here` with `primary` set when it
 * owns the save. A tab goes read-only on a `here` from a primary tab, or — when two tabs start
 * at once — from a tab with a lower id. Read-only never reverts; the player reloads.
 */
export function createTabGuard(
  channel: ChannelLike | null,
  tabId: string,
  sleep: (ms: number) => Promise<void>,
  onReadOnly: () => void,
): TabGuard {
  let readOnly = false;
  let primary = false;

  const becomeReadOnly = () => {
    if (readOnly) return;
    readOnly = true;
    primary = false;
    onReadOnly();
  };

  if (channel) {
    channel.onmessage = ({ data }) => {
      if (!isTabMessage(data) || data.id === tabId) return;
      if (data.kind === 'hello') {
        channel.postMessage({ kind: 'here', id: tabId, primary } satisfies TabMessage);
      } else if (data.primary || data.id < tabId) {
        becomeReadOnly();
      }
    };
  }

  return {
    async start() {
      if (!channel) {
        primary = true;
        return true;
      }
      channel.postMessage({ kind: 'hello', id: tabId, primary: false } satisfies TabMessage);
      await sleep(SAVE.TAB_HANDSHAKE_MS);
      if (!readOnly) primary = true;
      return primary;
    },
    isReadOnly: () => readOnly,
    close: () => channel?.close(),
  };
}
