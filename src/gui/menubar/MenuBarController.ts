import { MenuBarView } from "./MenuBarView";
import { MenuBarViewModel } from "./MenuBarViewModel";

export class MenuBarController {
    private view: MenuBarView;
    private viewModel: MenuBarViewModel;

    constructor(view: MenuBarView, viewModel: MenuBarViewModel) {
        this.view = view;
        this.viewModel = viewModel;
    }
}

