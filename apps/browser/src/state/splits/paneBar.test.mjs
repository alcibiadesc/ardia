import assert from "node:assert/strict";
import { test } from "node:test";
const { useBrowser } = await import("../browser/store.ts");
const { showOnceOverEmptySplitPane, showSplitPaneBar } = await import("./paneBar.ts");
const { splitOf } = await import("./splits.ts");

const S = () => useBrowser.getState();
const panel = (w) => S().windowUi[w]?.panel ?? { open: false };
const reset = (splitPaneOpens = "picker") => {
  S().hydrate({});
  S().updateSettings({ splitPaneOpens });
};

function windowWithEmptyPane() {
  const w = S().createWindow({ url: "https://a.com/" });
  const anchor = S().windows[w].tabIds[0];
  const result = S().openSplitPane(w);
  assert.ok(result.ok);
  return { w, anchor, pane: result.tabId };
}

test("setting off: an empty split pane never opens the command bar", () => {
  reset();
  const { w, pane } = windowWithEmptyPane();
  assert.equal(showOnceOverEmptySplitPane(pane), false);
  assert.equal(showSplitPaneBar(pane), false);
  assert.equal(panel(w).open, false);
});

test("setting on: a new empty split pane opens the centred command bar once", () => {
  reset("commandBar");
  const { w, pane } = windowWithEmptyPane();
  assert.equal(showOnceOverEmptySplitPane(pane), true);
  assert.deepEqual(panel(w), { open: true, initialText: "", placement: "centredNoField" });
  S().closePanel(w);
  assert.equal(showOnceOverEmptySplitPane(pane), false, "Esc keeps the bar down");
  assert.equal(panel(w).open, false);
});

test("setting on: the card's search row reopens the bar and focuses its pane", () => {
  reset("commandBar");
  const { w, anchor, pane } = windowWithEmptyPane();
  S().activate(anchor);
  assert.equal(showOnceOverEmptySplitPane(pane), false, "a pane that isn't focused doesn't pull the bar up");
  assert.equal(showSplitPaneBar(pane), true);
  assert.equal(S().windows[w].activeTabIds[S().windows[w].profileId], pane);
  assert.equal(panel(w).open, true);
});

test("setting on: a pick from the bar fills the pane and keeps the split", () => {
  reset("commandBar");
  const { w, anchor, pane } = windowWithEmptyPane();
  showOnceOverEmptySplitPane(pane);
  S().navigate(pane, "https://b.com/");
  assert.equal(S().tabs[pane].url, "https://b.com/");
  assert.ok(splitOf(S(), anchor) && splitOf(S(), anchor) === splitOf(S(), pane));
  assert.equal(showSplitPaneBar(pane), false, "a pane with a page has its own address field");
});

test("setting on: tabs outside a split and panes with a page are left alone", () => {
  reset("commandBar");
  const w = S().createWindow({ url: "https://a.com/" });
  const lone = S().newTab(w, {});
  assert.equal(showSplitPaneBar(lone), false);
  assert.equal(showSplitPaneBar(S().windows[w].tabIds[0]), false);
  assert.equal(panel(w).open, false);
});
