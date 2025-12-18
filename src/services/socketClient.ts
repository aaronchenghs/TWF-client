import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@twf/contracts";

type ContractSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type EmitArgs<E extends keyof ClientToServerEvents> = Parameters<
  ClientToServerEvents[E]
>;
type ListenArgs<E extends keyof ServerToClientEvents> = Parameters<
  ServerToClientEvents[E]
>;

type ContractOn = <E extends keyof ServerToClientEvents>(
  event: E,
  handler: ServerToClientEvents[E]
) => ContractSocket;

type ContractOff = <E extends keyof ServerToClientEvents>(
  event: E,
  handler: ServerToClientEvents[E]
) => ContractSocket;

type ContractOnce = <E extends keyof ServerToClientEvents>(
  event: E,
  handler: ServerToClientEvents[E]
) => ContractSocket;

export class SocketClient {
  private readonly socket: ContractSocket;

  constructor(url: string) {
    this.socket = io(url, { autoConnect: true });
  }

  connect(): void {
    if (!this.socket.connected) this.socket.connect();
  }

  disconnect(): void {
    if (this.socket.connected) this.socket.disconnect();
  }

  emit<E extends keyof ClientToServerEvents>(
    event: E,
    ...args: EmitArgs<E>
  ): void {
    this.socket.emit(event, ...args);
  }

  on<E extends keyof ServerToClientEvents>(
    event: E,
    handler: ServerToClientEvents[E]
  ): () => void {
    const on = this.socket.on as unknown as ContractOn;
    const off = this.socket.off as unknown as ContractOff;

    on.call(this.socket, event, handler);
    return () => {
      off.call(this.socket, event, handler);
    };
  }

  once<E extends keyof ServerToClientEvents>(
    event: E,
    handler: ServerToClientEvents[E]
  ): () => void {
    const once = this.socket.once as unknown as ContractOnce;
    const off = this.socket.off as unknown as ContractOff;

    once.call(this.socket, event, handler);
    return () => {
      off.call(this.socket, event, handler);
    };
  }

  waitFor<E extends keyof ServerToClientEvents>(
    event: E,
    timeoutMs = 8000
  ): Promise<ListenArgs<E>> {
    return new Promise<ListenArgs<E>>((resolve, reject) => {
      const off = this.socket.off as unknown as ContractOff;

      const handler = ((...args: ListenArgs<E>) => {
        cleanup();
        resolve(args);
      }) as unknown as ServerToClientEvents[E];

      const timer = window.setTimeout(() => {
        cleanup();
        reject(new Error(`Timed out waiting for ${String(event)}`));
      }, timeoutMs);

      const cleanup = () => {
        window.clearTimeout(timer);
        off.call(this.socket, event, handler);
      };

      this.on(event, handler);
    });
  }
}

export const socketClient = new SocketClient(
  import.meta.env.VITE_SERVER_URL as string
);
