import { getDefaultServiceLayer, type ServiceLayer } from "../../service/ServiceLayer";

export class ServiceProvider extends HTMLElement {
  private _serviceLayer: ServiceLayer;

  constructor() {
    super();
    this._serviceLayer = getDefaultServiceLayer();
  }

  set serviceLayer(value: ServiceLayer) {
    this._serviceLayer = value;
  }

  get serviceLayer(): ServiceLayer {
    return this._serviceLayer;
  }
}

customElements.define("service-provider", ServiceProvider);

declare global {
  interface HTMLElementTagNameMap {
    "service-provider": ServiceProvider;
  }
}
