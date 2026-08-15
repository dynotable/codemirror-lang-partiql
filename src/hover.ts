// Hover tooltips for PartiQL editors. Two layers:
//
//   1. Function docs — hovering a DynamoDB PartiQL function name
//      (begins_with, attribute_exists, …) always works, no configuration.
//   2. Field info — optional. Pass `getFieldInfo` resolving an attribute path
//      to whatever schema knowledge your app has (data type, occurrence
//      count) and the tooltip renders it. Without it, only layer 1 runs.
//
// Adapted from the DynoTable editor's hover extension: the app resolves
// fields against its local table index; here that dependency is inverted
// into the `getFieldInfo` callback so the package stays schema-agnostic.

import type {Extension} from '@codemirror/state';
import {hoverTooltip, type Tooltip} from '@codemirror/view';

import {PARTIQL_FUNCTIONS} from './constants';

/** Schema knowledge for one attribute path, rendered in the hover tooltip. */
export interface PartiQLFieldInfo {
  /** The attribute path, e.g. `address.city`. */
  path: string;
  /** DynamoDB data type tag (S, N, B, BOOL, NULL, L, M, SS, NS, BS), if known. */
  dataType?: string;
  /** In how many sampled items the attribute occurs, if known. */
  occurrenceCount?: number;
}

export interface PartiQLHoverOptions {
  /**
   * Resolve an attribute path under the cursor to field info, or null when
   * unknown. Async so it can consult an index, a cache, or a network.
   */
  getFieldInfo?: (path: string) => Promise<PartiQLFieldInfo | null>;
}

const FIELD_CHAR = /[\w.[\]]/;

/** Hover tooltips: PartiQL function docs, plus schema field info when `getFieldInfo` is provided. */
export function partiqlHoverTooltip(options: PartiQLHoverOptions = {}): Extension {
  const {getFieldInfo} = options;

  return hoverTooltip(async (view, pos): Promise<Tooltip | null> => {
    const line = view.state.doc.lineAt(pos);
    const {text} = line;
    const col = pos - line.from;

    let wordStart = col;
    let wordEnd = col;
    while (wordStart > 0 && FIELD_CHAR.test(text[wordStart - 1])) wordStart--;
    while (wordEnd < text.length && FIELD_CHAR.test(text[wordEnd])) wordEnd++;

    if (wordStart === wordEnd) return null;

    const wordText = text.slice(wordStart, wordEnd);
    const from = line.from + wordStart;
    const to = line.from + wordEnd;

    if (getFieldInfo) {
      try {
        const field = await getFieldInfo(wordText);
        if (field && field.path === wordText) {
          return {
            pos: from,
            end: to,
            above: true,
            create: () => {
              const dom = document.createElement('div');
              dom.className = 'cm-partiql-hover';
              dom.style.padding = '4px 8px';
              dom.style.fontSize = '12px';
              dom.style.lineHeight = '1.5';

              const addLine = (label: string, value: string) => {
                const strong = document.createElement('strong');
                strong.textContent = `${label}: `;
                dom.appendChild(strong);
                dom.appendChild(document.createTextNode(value));
                dom.appendChild(document.createElement('br'));
              };

              addLine('Field', field.path);
              if (field.dataType) addLine('Type', field.dataType);
              if (field.occurrenceCount !== undefined) {
                addLine('Occurrences', `${field.occurrenceCount} items`);
              }
              return {dom};
            }
          };
        }
      } catch {
        // Field info is best-effort — fall through to function docs.
      }
    }

    if (PARTIQL_FUNCTIONS.includes(wordText.toLowerCase())) {
      return {
        pos: from,
        end: to,
        above: true,
        create: () => {
          const dom = document.createElement('div');
          dom.className = 'cm-partiql-hover';
          dom.style.padding = '4px 8px';
          dom.style.fontSize = '12px';
          const strong = document.createElement('strong');
          strong.textContent = 'PartiQL Function: ';
          dom.appendChild(strong);
          dom.appendChild(document.createTextNode(`${wordText}()`));
          return {dom};
        }
      };
    }

    return null;
  });
}
