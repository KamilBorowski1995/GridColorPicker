class GridColorPicker {
  constructor(input, options) {
    this.name = "GridColorPicker";
    this.selector = "gcp";
    this.components = {
      input: input,
      inputAutocomplete: null,
      modal: {
        id: null,
        element: null,
        container: null,
      },
    };
    this.input = input;

    // Options
    this.setSelectType = options?.setSelectType || "hex";
    this.mainColors = options?.mainColors || colorsPalette.main;
    this.othersColors = options?.othersColors || colorsPalette.others;
    this.animation = options?.animation || "none";
    this.itemsPerRow = options?.itemsPerRow || 8;
    this.defaultColor = options?.defaultColor || null;
    this.callback = options?.callback || null;

    this.isModalOpen = false;

    this.#init();
  }

  #init() {
    if (!this.input) {
      console.error("Element GridColorPicker not found");
      return;
    }

    this.#createId();
    this.#convertInputToHidden();
    this.#createModal();
  }

  open() {
    this.components.modal.element.classList.add("open");
    this.isModalOpen = true;
  }

  close() {
    this.components.modal.element.classList.add("close");
    this.components.modal.element.classList.remove("open");
    setTimeout(() => {
      this.components.modal.element.classList.remove("close");
    }, 300);
    this.isModalOpen = false;
  }

  isOpen() {
    return this.isModalOpen;
  }

  #createId() {
    let tmpId = `${this.selector}-${(
      Math.random().toString(36) + "000000000"
    ).slice(2, 10)}`;
    this.components.modal.id = tmpId;
  }

  #convertInputToHidden() {
    const input = this.input;
    input.type = "hidden";

    const wrapper = document.createElement("div");
    wrapper.classList.add(`${this.selector}-autocomplete-wrapper`);

    const inputAutocomplete = document.createElement("input");
    inputAutocomplete.type = "text";
    inputAutocomplete.id = input.id + "_autocomplete";
    inputAutocomplete.className = input.className;

    wrapper.appendChild(inputAutocomplete);

    input.insertAdjacentElement("afterend", wrapper);
    this.components.inputAutocomplete = inputAutocomplete;

    this.#addColorFromInitValue();
  }

  #createModal() {
    const node = document.createElement("div");
    node.id = this.components.modal.id;
    node.classList.add(this.selector);
    node.style.position = "absolute";
    if (/^(slide|fade)$/.test(this.animation)) {
      node.classList.add(this.animation);
    }
    node.style.zIndex = 9999;

    const container = document.createElement("div");
    container.classList.add(`${this.selector}-container`, "fs-xs");

    node.appendChild(container);

    this.components.inputAutocomplete.parentElement.appendChild(node);

    this.components.modal.element = node;
    this.components.modal.container = container;

    this.#addOpenListener();
    this.#addCloseListener();

    this.#renderBody();
  }

  async #addColorFromInitValue() {
    const valueID = this.input.value;

    if (!valueID && !this.defaultColor) {
      return;
    }
    this.#addColorBoxToInput(this.defaultColor, valueID);
  }

  #addOpenListener() {
    this.components.inputAutocomplete.addEventListener("click", () => {
      if (!this.isModalOpen) {
        this.open();
      }
    });
  }

  #addCloseListener() {
    document.addEventListener("click", (event) => {
      if (
        !this?.components?.modal?.element?.contains(event.target) &&
        !this?.components?.inputAutocomplete?.contains(event.target) &&
        this.isModalOpen
      ) {
        this.close();
      }
    });
  }

  #renderBody() {
    const lastTbody = document
      .getElementById(this.components.modal.id)
      .querySelector(`${this.selector}-palette`);
    if (lastTbody) {
      return;
    }

    const colorPaletteWrapper = document.createElement("div");
    colorPaletteWrapper.classList.add(`${this.selector}-palette`);

    const topColors = document.createElement("div");
    topColors.classList.add(`${this.selector}-top-colors`);
    colorPaletteWrapper.appendChild(topColors);

    const gridColors = document.createElement("div");
    gridColors.classList.add(`${this.selector}-grid-colors`);
    colorPaletteWrapper.appendChild(gridColors);

    this.#renderColorGroups(this.mainColors, topColors, `${this.selector}-row`);

    this.#renderColorGroups(
      this.othersColors,
      gridColors,
      `${this.selector}-row`
    );

    this.components.modal.container.appendChild(colorPaletteWrapper);
  }

  #renderColorGroups(colors, parentElement, rowClass) {
    let colorRow;
    colors.forEach((color, index) => {
      if (index % this.itemsPerRow === 0) {
        colorRow = document.createElement("div");
        colorRow.classList.add(rowClass);
        parentElement.appendChild(colorRow);
      }

      const colorWrapper = document.createElement("div");
      colorWrapper.classList.add(`${this.selector}-box`);

      colorWrapper.setAttribute("data-color", color);

      const colorNode = document.createElement("div");
      colorNode.classList.add(`${this.selector}-box-color`);
      colorNode.style.backgroundColor = color;
      colorNode.addEventListener("click", () => {
        this.#addColorBoxToInput(color);
        this.close();
      });

      colorWrapper.appendChild(colorNode);
      colorRow.appendChild(colorWrapper);
    });
  }

  #addColorBoxToInput(defaultColor, inoutValueColor) {
    let color = null;

    if (defaultColor) {
      const isColor =
        this.#detectColorFormat(defaultColor) !== "Unknown format";
      color = isColor ? defaultColor : null;
    }

    if (!color && inoutValueColor) {
      const isColor =
        this.#detectColorFormat(inoutValueColor) !== "Unknown format";
      color = isColor ? inoutValueColor : null;
    }

    const colorFormated = this.#convertColor(color, this.setSelectType);

    this.components.input.value = this.components.inputAutocomplete.value =
      colorFormated;

    const wrapper = this.components.inputAutocomplete;

    wrapper.style.backgroundColor = colorFormated;
    wrapper.style.color = "transparent";

    const findActive = document.querySelectorAll(
      `.${this.selector}-box.active`
    );
    if (findActive) {
      findActive.forEach((item) => {
        item.classList.remove("active");
      });
    }

    const findDataColor = document.querySelectorAll(`[data-color="${color}"]`);
    if (findDataColor) {
      findDataColor.forEach((item) => {
        item.classList.add("active");
      });
    }

    if (typeof this.callback === "function") {
      this.callback(colorFormated);
    }
  }

  #detectColorFormat(color) {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const rgbRegex = /^rgb\((\s*\d{1,3}\s*,){2}\s*\d{1,3}\s*\)$/;
    const rgbaRegex = /^rgba\((\s*\d{1,3}\s*,){3}\s*(0|1|0?\.\d+)\s*\)$/;

    if (hexRegex.test(color)) {
      return "HEX";
    } else if (rgbRegex.test(color)) {
      return "RGB";
    } else if (rgbaRegex.test(color)) {
      return "RGBA";
    } else {
      return "Unknown format";
    }
  }

  #hexToRgb(hex) {
    let r, g, b;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex[1] + hex[2], 16);
      g = parseInt(hex[3] + hex[4], 16);
      b = parseInt(hex[5] + hex[6], 16);
    }
    return `rgb(${r}, ${g}, ${b})`;
  }

  #rgbToHex(rgb) {
    const rgbValues = rgb.match(/\d+/g);
    const r = parseInt(rgbValues[0]).toString(16).padStart(2, "0");
    const g = parseInt(rgbValues[1]).toString(16).padStart(2, "0");
    const b = parseInt(rgbValues[2]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }

  #rgbToRgba(rgb, alpha = 1) {
    const rgbValues = rgb.match(/\d+/g);
    return `rgba(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]}, ${alpha})`;
  }

  #rgbaToRgb(rgba) {
    const rgbaValues = rgba.match(/\d+/g);
    return `rgb(${rgbaValues[0]}, ${rgbaValues[1]}, ${rgbaValues[2]})`;
  }

  #hexToRgba(hex, alpha = 1) {
    const rgbColor = this.#hexToRgb(hex);
    return this.#rgbToRgba(rgbColor, alpha);
  }

  #convertColor(color, targetFormat, alpha = 1) {
    const currentFormat = this.#detectColorFormat(color);

    if (currentFormat === "Unknown format") {
      return "Invalid color format";
    }

    targetFormat = targetFormat.toUpperCase();

    if (currentFormat === targetFormat) {
      return color;
    }

    switch (currentFormat) {
      case "HEX":
        if (targetFormat === "RGB") {
          return this.#hexToRgb(color);
        } else if (targetFormat === "RGBA") {
          return this.#hexToRgba(color, alpha);
        }
        break;
      case "RGB":
        if (targetFormat === "HEX") {
          return this.#rgbToHex(color);
        } else if (targetFormat === "RGBA") {
          return this.#rgbToRgba(color, alpha);
        }
        break;
      case "RGBA":
        if (targetFormat === "RGB") {
          return this.#rgbaToRgb(color);
        } else if (targetFormat === "HEX") {
          return this.#rgbToHex(this.#rgbaToRgb(color));
        }
        break;
    }
    return "Conversion not supported";
  }
}

const colorsPalette = {
  main: [
    "#ff0000",
    "#ff6600",
    "#ffff00",
    "#00ff00",
    "#00ffff",
    "#0000ff",
    "#ff00ff",
    "#808080",
  ],
  others: [
    "#ffcccc",
    "#ffcc99",
    "#ffffcc",
    "#ccffcc",
    "#ccffff",
    "#ccccff",
    "#ffccff",
    "#cccccc",

    "#ff9999",
    "#ffcc66",
    "#ffff99",
    "#99ff99",
    "#99ffff",
    "#9999ff",
    "#ff99ff",
    "#999999",

    "#ff6666",
    "#ff9933",
    "#ffff66",
    "#66ff66",
    "#66ffff",
    "#6666ff",
    "#ff66ff",
    "#666666",

    "#ff3333",
    "#ff6633",
    "#ffff33",
    "#33ff33",
    "#33ffff",
    "#3333ff",
    "#ff33ff",
    "#333333",

    "#ff0000",
    "#ff6600",
    "#ffff00",
    "#00ff00",
    "#00ffff",
    "#0000ff",
    "#ff00ff",
    "#000000",

    "#cc0000",
    "#cc6600",
    "#cccc00",
    "#00cc00",
    "#00cccc",
    "#0000cc",
    "#cc00cc",
    "#4d4d4d",

    "#990000",
    "#994c00",
    "#999900",
    "#009900",
    "#009999",
    "#000099",
    "#990099",
    "#666666",

    "#660000",
    "#663300",
    "#666600",
    "#006600",
    "#006666",
    "#000066",
    "#660066",
    "#333333",
  ],
};
