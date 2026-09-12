import * as renderer from "@ccxp-lite/ui/renderer";
import * as controller from "@ccxp-lite/ui/controller";
import * as buttons from "@ccxp-lite/ui/buttons";
import * as icons from "@ccxp-lite/ui/icons";
import * as display from "@ccxp-lite/ui/display";
import * as switchControl from "@ccxp-lite/ui/switch";
import * as popover from "@ccxp-lite/ui/popover";
import * as fields from "@ccxp-lite/ui/fields";
import * as dialog from "@ccxp-lite/ui/dialog";

globalThis.CCXP_LITE ??= {};
const namespace = globalThis.CCXP_LITE;
namespace.uiRenderer = renderer;
namespace.uiController = controller;
namespace.uiButtons = buttons;
namespace.uiIcons = icons;
namespace.uiDisplay = display;
namespace.uiSwitch = switchControl;
namespace.loginFieldView = fields;
namespace.sidebarDialogView = dialog;
function registerPopover<T extends Node>(mounted: {
  element: T;
  destroy: () => void;
}): { element: T; destroy: () => void } {
  namespace.sharedDom?.addCleanupTask(mounted.destroy);
  return mounted;
}
namespace.uiPopover = {
  mountInfoPopover: (...args) => registerPopover(popover.mountInfoPopover(...args)),
  mountInfoPopoverContent: (...args) => registerPopover(popover.mountInfoPopoverContent(...args)),
  buildInfoPopover: (...args) => registerPopover(popover.mountInfoPopover(...args)).element,
  buildInfoPopoverContent: (...args) =>
    registerPopover(popover.mountInfoPopoverContent(...args)).element,
};
