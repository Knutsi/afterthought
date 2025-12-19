import type { ServiceLayer } from "./ServiceLayer";

export class ContextService extends EventTarget {

    constructor(_: ServiceLayer) {
        super();
    }
}