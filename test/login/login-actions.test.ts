import { expect, test } from "vitest";
import {
  createTestWindow,
  loadModules,
  loginModulePaths,
  requireElement,
  requireValue,
} from "../helpers/module-loader.js";

test("native submit replacements preserve the host submission attributes and every action", () => {
  const { window } = createTestWindow(`
    <form>
      <input type="submit" class="host-action" id="login" name="submit" value="Login"
        formaction="select_entry.php" formmethod="post" formtarget="main"
        onclick="return validate(this.form)" formnovalidate disabled>
      <input type="submit" name="help" value="Help">
    </form>
  `);
  loadModules(window, loginModulePaths);
  const document = window.document as Document;
  const actions = requireValue(window.CCXP_LITE.loginActions);
  actions.wrapPrimaryLoginButtons(document, document);
  actions.wrapPrimaryLoginButtons(document, document);

  const button = requireElement(document.querySelector<HTMLButtonElement>("#login"));
  expect(button.tagName).toBe("BUTTON");
  expect(button.name).toBe("submit");
  expect(button.value).toBe("Login");
  expect(button.disabled).toBe(true);
  expect(button.classList.contains("host-action")).toBe(true);
  expect(button.getAttribute("formaction")).toBe("select_entry.php");
  expect(button.getAttribute("formmethod")).toBe("post");
  expect(button.getAttribute("formtarget")).toBe("main");
  expect(button.getAttribute("onclick")).toBe("return validate(this.form)");
  expect(button.hasAttribute("formnovalidate")).toBe(true);
  expect(document.querySelectorAll(".ccxp-lite-login-action-group button")).toHaveLength(2);
  expect(document.querySelector("button[name='help']")?.textContent).toBe("Help");
});

test("login image submissions remain native while other image actions retain their handlers", () => {
  const { window } = createTestWindow(`
    <form action="pre_select_entry.php"><input id="native" type="image" alt="Login"></form>
    <form action="other.php">
      <input id="action" type="image" alt="Submit" name="save" title="Save"
        onclick="return validate(this.form)" formaction="save.php" formnovalidate>
      <input id="clear" type="image" alt="Reset">
    </form>
  `);
  loadModules(window, loginModulePaths);
  const document = window.document as Document;
  const actions = requireValue(window.CCXP_LITE.loginActions);
  actions.replaceLoginFormImageButtons(document, document);
  actions.replaceLoginFormImageButtons(document, document);

  expect(document.querySelector("#native")?.getAttribute("type")).toBe("image");
  const button = requireElement(document.querySelector<HTMLButtonElement>("#action"));
  expect(button.tagName).toBe("BUTTON");
  expect(button.textContent).toBe("Submit");
  expect(button.name).toBe("save");
  expect(button.title).toBe("Save");
  expect(button.getAttribute("onclick")).toBe("return validate(this.form)");
  expect(button.getAttribute("formaction")).toBe("save.php");
  expect(button.hasAttribute("formnovalidate")).toBe(true);
  expect(document.querySelector("#clear")).toBeNull();
});
