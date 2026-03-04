/**
 * Tag button: a toggleable pill-shaped button that optionally reveals
 * inline inputs (numbers, selects) when active.
 *
 * @example
 * ```typescript
 * // Simple toggle
 * const staticBtn = createTagButton('static');
 * container.appendChild(staticBtn.element);
 *
 * // Toggle with parameterized inputs
 * const govBtn = createTagButton('gravity_override', {
 *   inputs: [
 *     { label: 'x', defaultValue: 0, step: 0.1 },
 *     { label: 'y', defaultValue: -1, step: 0.1 },
 *   ],
 * });
 * container.appendChild(govBtn.element);
 *
 * // Read state when needed
 * if (govBtn.isActive()) {
 *   const gx = parseFloat(govBtn.getValue(0));
 *   const gy = parseFloat(govBtn.getValue(1));
 * }
 * ```
 */

export interface TagButtonNumberInputConfig {
  type?: 'number';
  /** Short label rendered before the input (e.g. 'x', 'y') */
  label?: string;
  defaultValue?: number;
  step?: number;
  min?: number;
  max?: number;
}

export interface TagButtonSelectInputConfig {
  type: 'select';
  label?: string;
  options?: Array<{ value: string; label: string }>;
}

export type TagButtonInputConfig = TagButtonNumberInputConfig | TagButtonSelectInputConfig;

export interface TagButtonConfig {
  defaultActive?: boolean;
  inputs?: TagButtonInputConfig[];
  onChange?: (active: boolean) => void;
}

export interface TagButton {
  element: HTMLElement;
  isActive(): boolean;
  setActive(active: boolean): void;
  toggle(): void;
  /** Get the string value of the input at position index */
  getValue(index: number): string;
  /** Direct access to the underlying input or select element */
  getInput(index: number): HTMLInputElement | HTMLSelectElement | undefined;
}

export function createTagButton(label: string, config: TagButtonConfig = {}): TagButton {
  const { defaultActive = false, inputs = [], onChange } = config;

  const hasInputs = inputs.length > 0;
  const el = document.createElement(hasInputs ? 'div' : 'button') as HTMLElement;
  el.className = 'blork-tabs-tag-btn';
  if (hasInputs) {
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
  }

  el.appendChild(document.createTextNode(label));

  const inputElements: Array<HTMLInputElement | HTMLSelectElement> = [];

  if (hasInputs) {
    const inputsContainer = document.createElement('span');
    inputsContainer.className = 'blork-tabs-tag-inputs';

    for (const inputConfig of inputs) {
      if (inputConfig.label) {
        const labelSpan = document.createElement('span');
        labelSpan.textContent = inputConfig.label;
        inputsContainer.appendChild(labelSpan);
      }

      if (inputConfig.type === 'select') {
        const select = document.createElement('select');
        select.className = 'blork-tabs-tag-select';
        for (const opt of (inputConfig.options ?? [])) {
          const option = document.createElement('option');
          option.value = opt.value;
          option.textContent = opt.label;
          select.appendChild(option);
        }
        select.addEventListener('click', e => e.stopPropagation());
        select.addEventListener('mousedown', e => e.stopPropagation());
        inputsContainer.appendChild(select);
        inputElements.push(select);
      } else {
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'blork-tabs-tag-input';
        if (inputConfig.defaultValue !== undefined) input.value = String(inputConfig.defaultValue);
        if (inputConfig.step !== undefined) input.step = String(inputConfig.step);
        if (inputConfig.min !== undefined) input.min = String(inputConfig.min);
        if (inputConfig.max !== undefined) input.max = String(inputConfig.max);
        input.addEventListener('click', e => e.stopPropagation());
        inputsContainer.appendChild(input);
        inputElements.push(input);
      }
    }

    el.appendChild(inputsContainer);
  }

  let active = defaultActive;
  if (active) el.classList.add('active');

  const setActive = (value: boolean) => {
    active = value;
    el.classList.toggle('active', active);
    onChange?.(active);
  };

  el.addEventListener('click', () => setActive(!active));
  el.addEventListener('keydown', (e: Event) => {
    const ke = e as KeyboardEvent;
    if (ke.key === 'Enter' || ke.key === ' ') {
      ke.preventDefault();
      setActive(!active);
    }
  });

  return {
    element: el,
    isActive: () => active,
    setActive,
    toggle: () => setActive(!active),
    getValue: (index: number) => inputElements[index]?.value ?? '',
    getInput: (index: number) => inputElements[index],
  };
}
