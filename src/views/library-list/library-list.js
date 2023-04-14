/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { LitElement, html, css } from 'lit';
import AppModel from '../../models/app-model.js';
import { EventBus } from '../../events/eventbus.js';
import { isDev } from '../../utils/library.js';
import { capitalize } from '../../utils/dom.js';
import { LIBRARY_LOADED, TOAST } from '../../events/events.js';
import { loadPlugin } from '../../utils/plugin.js';

const plugins = {
  blocks: isDev() ? '../../src/plugins/blocks/blocks.js' : `${AppModel.host}/plugins/blocks/blocks.js`,
  taxonomy: isDev() ? '../../src/plugins/taxonomy/taxonomy.js' : `${AppModel.host}/plugins/taxonomy/taxonomy.js`,
};

export class LibraryList extends LitElement {
  static properties = {
    libraries: undefined,
  };

  static styles = css`
    sp-sidenav {
      width: 100%;
    }
  `;

  connectedCallback() {
    super.connectedCallback();

    EventBus.instance.addEventListener(LIBRARY_LOADED, () => {
      this.libraries = AppModel.appStore.libraries;
    });
  }

  async onSelect(e) {
    const { value } = e.target;
    const { config } = AppModel.appStore;

    const pluginPath = config[value] ?? plugins[value];
    if (pluginPath) {
      await loadPlugin(AppModel, value, pluginPath);
      return;
    }

    EventBus.instance.dispatchEvent(new CustomEvent(TOAST, {
      detail: {
        variant: 'negative',
        message: AppModel.appStore.localeDict.unknownPlugin,
      },
    }));
  }

  renderLibraries() {
    if (this.libraries) {
      return Object.keys(this.libraries).map(
        key => html`<sp-sidenav-item value=${key} disclosureArrow="true" data-testid="library-item">${capitalize(key)}</sidenav-item>`,
      );
    }

    return '';
  }

  render() {
    return html`<div class="home">
      <sp-sidenav @click=${this.onSelect} data-testid=${this.libraries ? 'libraries-loaded' : ''}>
       ${this.renderLibraries()}
      </sp-sidenav>
    </div>`;
  }
}

customElements.define('library-list', LibraryList);
