import { useBrowser, type BrowserState } from "../browser/store";
import { activeTabId } from "../browser/model";
import { hasPage } from "../tabs/pageSession";
import { noteSplit } from "../telemetry/usage";
import { closePane } from "./actions";
import { splitOf } from "./splits";

const store = () => useBrowser.getState();
const shownOver = new Set<string>();

export const splitPaneOpensBar = (s: Pick<BrowserState, "settings">) => s.settings.splitPaneOpens === "commandBar";

export function isEmptySplitPane(s: BrowserState, tabId: string): boolean {
  const tab = s.tabs[tabId];
  return !!tab && !tab.url && !hasPage(tab) && !!splitOf(s, tabId);
}

export function showSplitPaneBar(tabId: string): boolean {
  const s = store();
  const tab = s.tabs[tabId];
  if (!tab || !splitPaneOpensBar(s) || !isEmptySplitPane(s, tabId)) return false;
  if (activeTabId(s, tab.windowId) !== tabId) s.activate(tabId);
  store().openPanel(tab.windowId, "", undefined, "centredNoField");
  noteSplit("splitPaneBarOpens");
  return true;
}

export function showOnceOverEmptySplitPane(tabId: string): boolean {
  if (shownOver.has(tabId)) return false;
  const s = store();
  const tab = s.tabs[tabId];
  if (!tab || !splitPaneOpensBar(s) || !isEmptySplitPane(s, tabId)) return false;
  shownOver.add(tabId);
  if (activeTabId(s, tab.windowId) !== tabId || s.windowUi[tab.windowId]?.panel.open) return false;
  return showSplitPaneBar(tabId);
}

export function closeEmptySplitPane(tabId: string): boolean {
  if (!isEmptySplitPane(store(), tabId)) return false;
  noteSplit("splitPaneEscapeCloses");
  closePane(tabId);
  return true;
}
