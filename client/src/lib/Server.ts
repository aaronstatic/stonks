import type Object from '@schema/object';
import Trade from '@schema/trade';
import Option from '@schema/option';

const callbacks: { [id: string]: Function } = {};

type Call = {
    method: string;
    data: any;
    resolve: (value: any) => void;
}

type Events = {
    [key: string]: Function[];
}

const queuedCalls: Call[] = [];

export default class Server {
    static ws: WebSocket;
    static events: Events;
    static init() {
        this.ws = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL || 'wss://stonks.aaronstatic.com');

        this.ws.onopen = () => {
            console.log('Connected to server');

            queuedCalls.forEach((call) => {
                this.call(call.method, call.data).then(call.resolve);
            });
        }

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data.toString());

            if (!message.id && message.msg) {
                this.emit(message.msg, message.data);
                return;
            }

            if (callbacks[message.id]) {
                callbacks[message.id](message.result);
                delete callbacks[message.id];
            }
        }

        this.ws.onerror = (error) => {
            console.error(error);
        }

        this.ws.onclose = () => {
            console.log('Disconnected from server');

        }

        this.events = {};
    }

    static on(event: string, callback: Function) {
        if (!this.events[event]) {
            this.events[event] = [];
        }

        this.events[event].push(callback);
    }

    static emit(event: string, data: any) {
        if (!this.events[event]) {
            return;
        }

        this.events[event].forEach((callback) => {
            callback(data);
        });
    }

    static async call(method: string, data: any): Promise<any> {

        if (!this.ws || this.ws.readyState === WebSocket.CONNECTING) {
            return new Promise((resolve) => {
                queuedCalls.push({ method, data, resolve });
            });
        }

        return new Promise((resolve) => {
            const id = "cb-" + Math.random().toString(16).slice(2);

            this.ws.send(JSON.stringify({
                id,
                method,
                data
            }));

            callbacks[id] = resolve;
        });
    }
    static async getAll(type: string): Promise<Object[]> {
        return new Promise((resolve) => {
            this.call('get-objects', { type }).then((data) => {
                resolve(data as Object[]);
            });
        });
    }
    static async query(type: string, query: any): Promise<Object[]> {
        return new Promise((resolve) => {
            this.call('query-objects', { type, query }).then((data) => {
                resolve(data as Object[]);
            });
        });
    }
    static async queryDatabase(collection: string, query: any): Promise<Object[]> {
        return new Promise((resolve) => {
            this.call('query-database', { collection, query }).then((data) => {
                resolve(data as Object[]);
            });
        });
    }
    static async create(type: string, object: Object): Promise<Object> {
        return new Promise((resolve) => {
            this.call('create-object', { type, object }).then((data) => {
                resolve(data as Object);
            });
        });
    }
    static async update(type: string, id: string, object: Object): Promise<Object> {
        return new Promise((resolve) => {
            this.call('update-object', { type, id, object }).then((data) => {
                resolve(data as Object);
            });
        });
    }
    static async delete(type: string, id: string): Promise<void> {
        return new Promise((resolve) => {
            this.call('delete-object', { type, id }).then(() => {
                resolve();
            });
        });
    }

    static async get(type: string, id: string): Promise<Object> {
        return new Promise((resolve) => {
            this.call('get-object', { type, id }).then((data) => {
                resolve(data as Object);
            });
        });
    }

    static async getReport(type: string, params: any = {}): Promise<any> {
        return new Promise((resolve) => {
            this.call('get-report', { type, params }).then((data) => {
                resolve(data);
            });
        });
    }

    static async addTrade(ticker: string, tradeType: string, trade: Trade, option: Option): Promise<void> {
        return new Promise((resolve) => {
            this.call('add-trade', { ticker, tradeType, trade, option }).then(() => {
                resolve();
            });
        });
    }

    static async getSession(sessionId: string): Promise<{ userData: { id: string, currency: string, portfolioId: string }, sessionId: string }> {
        return new Promise((resolve) => {
            this.call('get-session', { sessionId }).then((data) => {
                resolve(data);
            });
        });
    }

    static async getPortfolios(): Promise<{ name: string, id: string }[]> {
        return new Promise((resolve) => {
            this.call('get-portfolios', {}).then((data) => {
                resolve(data);
            });
        });
    }

    static async setPortfolio(portfolioId: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.call('set-portfolio', { portfolioId }).then((result: boolean) => {
                resolve(result);
            });
        });
    }

    static async addPortfolio(name: string): Promise<{ name: string, _id: string }> {
        return new Promise((resolve) => {
            this.call('add-portfolio', { name }).then((result: { name: string, _id: string }) => {
                resolve(result);
            });
        });
    }

}