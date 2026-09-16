/** Runtime bindings used by both the hosted worker and the local D1 adapter. */
interface D1Result<T=unknown>{success:boolean;results:T[];meta:Record<string,unknown>;error?:string}
interface D1PreparedStatement{bind(...values:unknown[]):D1PreparedStatement;all<T=unknown>():Promise<D1Result<T>>;first<T=unknown>(column?:string):Promise<T|null>;raw<T=unknown[]>(options?:{columnNames?:boolean}):Promise<T[]>;run<T=unknown>():Promise<D1Result<T>>}
interface D1Database{prepare(query:string):D1PreparedStatement;batch<T=unknown>(statements:D1PreparedStatement[]):Promise<D1Result<T>[]>;exec(query:string):Promise<{count:number;duration:number}>}
interface Fetcher{fetch(request:Request):Promise<Response>}
declare module 'cloudflare:workers'{export const env:{DB?:D1Database;[name:string]:unknown}}
